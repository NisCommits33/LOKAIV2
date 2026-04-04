/**
 * POST /api/admin/billing/check-status — Manually verify a pending transaction
 *
 * Super Admin only. Uses eSewa/Khalti Status APIs to verify transactions
 * that are stuck in "initiated" status (e.g. due to redirect failures).
 *
 * Body: { transactionId: string }
 *
 * @module api/admin/billing/check-status
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { NextResponse, type NextRequest } from "next/server";
import { verifyKhaltiPayment } from "@/lib/payments/khalti";
import { createPaymentInvoice } from "@/lib/payments/invoice";

const ESEWA_STATUS_URLS = {
  sandbox: "https://rc.esewa.com.np/api/epay/transaction/status/",
  production: "https://esewa.com.np/api/epay/transaction/status/",
};

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
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "super_admin") {
    return NextResponse.json(
      { error: "Forbidden: Super Admin only" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { transactionId, customYears } = body;

  if (!transactionId) {
    return NextResponse.json(
      { error: "transactionId is required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Fetch the initiated transaction (super admin can verify any org's transaction)
  const { data: txn, error: txnErr } = await admin
    .from("payment_transactions")
    .select("*, plan:subscription_plans(*)")
    .eq("id", transactionId)
    .eq("status", "initiated")
    .single();

  if (txnErr || !txn) {
    return NextResponse.json(
      { error: "Transaction not found or already processed" },
      { status: 404 }
    );
  }

  // ── Route to the correct gateway ──
  if (txn.gateway === "khalti") {
    return verifyKhaltiTransaction(txn, admin, customYears);
  } else {
    return verifyEsewaTransaction(txn, admin, customYears);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function verifyKhaltiTransaction(txn: any, admin: any, customYears?: number) {
  const pidx = txn.gateway_transaction_id;
  if (!pidx) {
    return NextResponse.json(
      { error: "No Khalti pidx found for this transaction" },
      { status: 400 }
    );
  }

  try {
    const result = await verifyKhaltiPayment(pidx);

    if (result.success && result.data?.status === "Completed") {
      const now = new Date();
      const periodEnd = new Date(now);

      if (customYears && typeof customYears === "number" && customYears > 0) {
        periodEnd.setFullYear(periodEnd.getFullYear() + customYears);
      } else if (txn.billing_cycle === "yearly") {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      await admin
        .from("payment_transactions")
        .update({
          status: "completed",
          gateway_transaction_id: result.data.transaction_id || pidx,
          gateway_status: "Completed",
          raw_response: result.data,
          completed_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", txn.id);

      await admin
        .from("organization_subscriptions")
        .update({ status: "expired", updated_at: now.toISOString() })
        .eq("organization_id", txn.organization_id)
        .eq("status", "active");

      const { data: newSub } = await admin
        .from("organization_subscriptions")
        .insert({
          organization_id: txn.organization_id,
          plan_id: txn.plan_id,
          status: "active",
          billing_cycle: txn.billing_cycle,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
        })
        .select()
        .single();

      if (newSub) {
        await admin
          .from("payment_transactions")
          .update({ subscription_id: newSub.id })
          .eq("id", txn.id);
      }

      // Auto-create a paid invoice
      await createPaymentInvoice({
        organizationId: txn.organization_id,
        subscriptionId: newSub?.id || null,
        amount: txn.amount,
        taxAmount: txn.tax_amount,
        totalAmount: txn.total_amount,
        gateway: "khalti",
        gatewayTransactionId: result.data.transaction_id || pidx,
        transactionId: txn.id,
        planName: txn.plan?.display_name || txn.plan?.name || "Plan",
        billingCycle: txn.billing_cycle,
      });

      return NextResponse.json({
        status: "completed",
        message: "Payment verified and subscription activated",
      });
    } else if (
      result.data?.status === "Expired" ||
      result.data?.status === "User canceled"
    ) {
      await admin
        .from("payment_transactions")
        .update({
          status: "failed",
          gateway_status: result.data.status,
          failure_reason: `Khalti status: ${result.data.status}`,
          raw_response: result.data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", txn.id);

      return NextResponse.json({
        status: "failed",
        message: `Payment ${result.data.status.toLowerCase()}`,
      });
    } else {
      return NextResponse.json({
        status: "pending",
        message: `Payment status: ${result.data?.status || "unknown"}. Please try again later.`,
        khaltiStatus: result.data?.status,
      });
    }
  } catch {
    return NextResponse.json(
      { error: "Failed to verify with Khalti" },
      { status: 500 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function verifyEsewaTransaction(txn: any, admin: any, customYears?: number) {
  const isProduction = process.env.ESEWA_ENVIRONMENT === "production";
  const statusBaseUrl = isProduction
    ? ESEWA_STATUS_URLS.production
    : ESEWA_STATUS_URLS.sandbox;
  const productCode = process.env.ESEWA_MERCHANT_CODE || "EPAYTEST";

  const statusUrl = new URL(statusBaseUrl);
  statusUrl.searchParams.set("product_code", productCode);
  statusUrl.searchParams.set("total_amount", String(txn.total_amount));
  statusUrl.searchParams.set("transaction_uuid", txn.transaction_uuid);

  try {
    const statusRes = await fetch(statusUrl.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!statusRes.ok) {
      return NextResponse.json(
        { error: "Failed to reach eSewa status API" },
        { status: 502 }
      );
    }

    const statusData = await statusRes.json();

    if (statusData.status === "COMPLETE") {
      // Payment was completed — activate subscription
      const now = new Date();
      const periodEnd = new Date(now);

      // If super admin specified custom years, use that. 
      // Otherwise fallback to whatever was in the transaction (monthly/yearly)
      if (customYears && typeof customYears === "number" && customYears > 0) {
        periodEnd.setFullYear(periodEnd.getFullYear() + customYears);
      } else if (txn.billing_cycle === "yearly") {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      // Mark transaction completed
      await admin
        .from("payment_transactions")
        .update({
          status: "completed",
          gateway_transaction_id: statusData.ref_id || null,
          gateway_status: "COMPLETE",
          raw_response: statusData,
          completed_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", txn.id);

      // Expire old active subscription
      await admin
        .from("organization_subscriptions")
        .update({ status: "expired", updated_at: now.toISOString() })
        .eq("organization_id", txn.organization_id)
        .eq("status", "active");

      // Create new active subscription
      const { data: newSub } = await admin
        .from("organization_subscriptions")
        .insert({
          organization_id: txn.organization_id,
          plan_id: txn.plan_id,
          status: "active",
          billing_cycle: txn.billing_cycle,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
        })
        .select()
        .single();

      if (newSub) {
        await admin
          .from("payment_transactions")
          .update({ subscription_id: newSub.id })
          .eq("id", txn.id);
      }

      // Auto-create a paid invoice
      await createPaymentInvoice({
        organizationId: txn.organization_id,
        subscriptionId: newSub?.id || null,
        amount: txn.amount,
        taxAmount: txn.tax_amount,
        totalAmount: txn.total_amount,
        gateway: "esewa",
        gatewayTransactionId: statusData.ref_id || null,
        transactionId: txn.id,
        planName: txn.plan?.display_name || txn.plan?.name || "Plan",
        billingCycle: txn.billing_cycle,
      });

      return NextResponse.json({
        status: "completed",
        message: "Payment verified and subscription activated",
      });
    } else if (statusData.status === "NOT_FOUND" || statusData.status === "CANCELED") {
      // Payment was never completed — mark as failed
      await admin
        .from("payment_transactions")
        .update({
          status: "failed",
          gateway_status: statusData.status,
          failure_reason: `eSewa status: ${statusData.status}`,
          raw_response: statusData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", txn.id);

      return NextResponse.json({
        status: "failed",
        message: `Payment ${statusData.status.toLowerCase()}`,
      });
    } else {
      // PENDING, AMBIGUOUS, etc.
      return NextResponse.json({
        status: "pending",
        message: `Payment status: ${statusData.status}. Please try again later.`,
        esewaStatus: statusData.status,
      });
    }
  } catch {
    return NextResponse.json(
      { error: "Failed to verify with eSewa" },
      { status: 500 }
    );
  }
}
