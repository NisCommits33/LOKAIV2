/**
 * GET  /api/admin/billing — Current subscription, usage stats, payment history
 * POST /api/admin/billing — Initiate a plan upgrade via eSewa or Khalti
 *
 * @module api/admin/billing
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { NextResponse, type NextRequest } from "next/server";
import { getOrgSubscription } from "@/lib/payments/subscription";
import { createEsewaPaymentForm } from "@/lib/payments/esewa";
import { initiateKhaltiPayment } from "@/lib/payments/khalti";
import crypto from "crypto";

/**
 * GET — Fetch billing overview for the org admin's organization
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "org_admin" || !profile.organization_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orgId = profile.organization_id;

  try {
    const subInfo = await getOrgSubscription(orgId);

    // Fetch payment history
    const admin = createAdminClient();
    const { data: transactions } = await admin
      .from("payment_transactions")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(20);

    // Count current users for usage display
    const { count: userCount } = await admin
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("is_active", true);

    // Count actual documents (not stale subscription_usage counter)
    const { count: docCount } = await admin
      .from("org_documents")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId);

    return NextResponse.json({
      subscription: subInfo.subscription,
      effectivePlan: subInfo.effectivePlan,
      usage: {
        ...subInfo.usage,
        documents_used: docCount || 0,
        users_count: userCount || 0,
      },
      isExpired: subInfo.isExpired,
      transactions: transactions || [],
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch billing info" },
      { status: 500 }
    );
  }
}

/**
 * POST — Initiate a payment for plan upgrade/renewal
 * Body: { planId: string, billingCycle: 'monthly' | 'yearly', gateway?: 'esewa' | 'khalti' }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "org_admin" || !profile.organization_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { planId, billingCycle = "monthly", gateway = "esewa" } = body;

  if (!planId) {
    return NextResponse.json({ error: "planId is required" }, { status: 400 });
  }

  if (!["monthly", "yearly"].includes(billingCycle)) {
    return NextResponse.json(
      { error: "billingCycle must be 'monthly' or 'yearly'" },
      { status: 400 }
    );
  }

  if (!["esewa", "khalti"].includes(gateway)) {
    return NextResponse.json(
      { error: "gateway must be 'esewa' or 'khalti'" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Validate the plan exists
  const { data: plan } = await admin
    .from("subscription_plans")
    .select("*")
    .eq("id", planId)
    .eq("is_active", true)
    .single();

  if (!plan) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  if (plan.name === "free") {
    return NextResponse.json(
      { error: "Cannot purchase the free plan via payment" },
      { status: 400 }
    );
  }

  const amount =
    billingCycle === "yearly" ? plan.price_yearly : plan.price_monthly;
  const transactionUuid = crypto.randomUUID();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (gateway === "khalti") {
    // ── Khalti Payment Flow ──
    const returnUrl = `${appUrl}/api/admin/billing/khalti-verify`;

    // Create a pending transaction record
    const { error: txnError } = await admin
      .from("payment_transactions")
      .insert({
        organization_id: profile.organization_id,
        gateway: "khalti",
        amount,
        tax_amount: 0,
        total_amount: amount,
        product_code: "KHALTI",
        transaction_uuid: transactionUuid,
        status: "initiated",
        plan_id: planId,
        billing_cycle: billingCycle,
        initiated_by: user.id,
      });

    if (txnError) {
      return NextResponse.json(
        { error: "Failed to create transaction" },
        { status: 500 }
      );
    }

    const result = await initiateKhaltiPayment({
      amount,
      purchaseOrderId: transactionUuid,
      purchaseOrderName: `${plan.display_name} (${billingCycle})`,
      returnUrl,
      websiteUrl: appUrl,
    });

    if (!result.success || !result.data) {
      // Mark transaction as failed
      await admin
        .from("payment_transactions")
        .update({
          status: "failed",
          failure_reason: result.error || "Khalti initiation failed",
          updated_at: new Date().toISOString(),
        })
        .eq("transaction_uuid", transactionUuid);

      return NextResponse.json(
        { error: result.error || "Failed to initiate Khalti payment" },
        { status: 502 }
      );
    }

    // Store pidx for later verification
    await admin
      .from("payment_transactions")
      .update({
        gateway_transaction_id: result.data.pidx,
        updated_at: new Date().toISOString(),
      })
      .eq("transaction_uuid", transactionUuid);

    return NextResponse.json({
      gateway: "khalti",
      paymentUrl: result.data.payment_url,
    });
  } else {
    // ── eSewa Payment Flow ──
    const productCode = process.env.ESEWA_MERCHANT_CODE || "EPAYTEST";
    const successUrl = `${appUrl}/api/admin/billing/verify`;
    const failureUrl = `${appUrl}/admin/billing?payment=failed`;

    // Create a pending transaction record
    const { error: txnError } = await admin
      .from("payment_transactions")
      .insert({
        organization_id: profile.organization_id,
        gateway: "esewa",
        amount,
        tax_amount: 0,
        total_amount: amount,
        product_code: productCode,
        transaction_uuid: transactionUuid,
        status: "initiated",
        plan_id: planId,
        billing_cycle: billingCycle,
        initiated_by: user.id,
      });

    if (txnError) {
      return NextResponse.json(
        { error: "Failed to create transaction" },
        { status: 500 }
      );
    }

    // Generate eSewa payment form
    const paymentForm = createEsewaPaymentForm({
      amount,
      taxAmount: 0,
      transactionUuid,
      productCode,
      successUrl,
      failureUrl,
    });

    return NextResponse.json({
      gateway: "esewa",
      paymentUrl: paymentForm.url,
      formData: paymentForm.formData,
    });
  }
}
