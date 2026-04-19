/**
 * GET /api/admin/billing/khalti-verify — Khalti payment verification callback
 *
 * Khalti redirects here after payment with query params (pidx, status, etc.).
 * Verifies payment via Lookup API, updates the transaction, and activates the subscription.
 *
 * @module api/admin/billing/khalti-verify
 */

import { createAdminClient } from "@/lib/supabase/admin-client";
import { NextResponse, type NextRequest } from "next/server";
import { verifyKhaltiPayment } from "@/lib/payments/khalti";
import { createPaymentInvoice } from "@/lib/payments/invoice";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pidx = searchParams.get("pidx");
  const status = searchParams.get("status");
  const purchaseOrderId = searchParams.get("purchase_order_id");

  // Dynamically determine the app URL for redirects
  const origin = request.nextUrl.origin;
  const billingUrl = `${origin}/admin/billing`;

  try {
    if (!pidx) {
      console.error(`[Khalti Verify] No pidx found in callback params`);
      return NextResponse.redirect(`${billingUrl}?payment=failed&reason=no_pidx`);
    }

    console.log(`[Khalti Verify] Verifying: pidx=${pidx}, status=${status}, order=${purchaseOrderId}`);

    // If user canceled, redirect immediately
    if (status === "User canceled") {
      return NextResponse.redirect(`${billingUrl}?payment=failed&reason=user_canceled`);
    }

    // Verify payment via Khalti Lookup API
    const result = await verifyKhaltiPayment(pidx);

    if (!result.success || !result.data) {
      console.error(`[Khalti Verify] Verification failed: ${result.error}`);
      return NextResponse.redirect(
        `${billingUrl}?payment=failed&reason=${encodeURIComponent(result.error || "verification_failed")}`
      );
    }

    const admin = createAdminClient();

    // Find the pending transaction
    let txnQuery = admin
      .from("payment_transactions")
      .select("*, plan:subscription_plans(*)")
      .eq("gateway", "khalti")
      .eq("status", "initiated");

    if (purchaseOrderId) {
      txnQuery = txnQuery.eq("transaction_uuid", purchaseOrderId);
    } else {
      txnQuery = txnQuery.eq("gateway_transaction_id", pidx);
    }

    const { data: txn, error: txnErr } = await txnQuery.single();

    if (txnErr || !txn) {
      console.error(`[Khalti Verify] Transaction not found for pidx ${pidx}`);
      return NextResponse.redirect(`${billingUrl}?payment=failed&reason=transaction_not_found`);
    }

    // Verify amount matches (Khalti returns paisa)
    const expectedAmountPaisa = Math.round(txn.total_amount * 100);
    if (result.data.total_amount < expectedAmountPaisa) {
        // We allow higher payments (tips?), but not lower
        await admin.from("payment_transactions").update({
            status: "failed",
            failure_reason: `Amount mismatch: expected ${expectedAmountPaisa}, got ${result.data.total_amount}`,
            updated_at: new Date().toISOString()
        }).eq("id", txn.id);

        return NextResponse.redirect(`${billingUrl}?payment=failed&reason=amount_mismatch`);
    }

    // Mark transaction completed
    await admin.from("payment_transactions").update({
      status: "completed",
      gateway_transaction_id: result.data.transaction_id || pidx,
      gateway_status: result.data.status,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", txn.id);

    // Update Subscription
    const now = new Date();
    const periodEnd = new Date(now);
    if (txn.billing_cycle === "yearly") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    // Expire old subs
    await admin.from("organization_subscriptions")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("organization_id", txn.organization_id)
      .eq("status", "active");

    // Create new sub
    const { data: newSub } = await admin.from("organization_subscriptions").insert({
      organization_id: txn.organization_id,
      plan_id: txn.plan_id,
      status: "active",
      billing_cycle: txn.billing_cycle,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
    }).select().single();

    if (newSub) {
      await admin.from("payment_transactions").update({ subscription_id: newSub.id }).eq("id", txn.id);
    }

    // Create Invoice
    await createPaymentInvoice({
      organizationId: txn.organization_id,
      subscriptionId: newSub?.id || null,
      amount: txn.amount,
      taxAmount: txn.tax_amount,
      totalAmount: txn.total_amount,
      gateway: "khalti",
      gatewayTransactionId: result.data.transaction_id || pidx,
      transactionId: txn.id,
      planName: txn.plan?.display_name || "Plan",
      billingCycle: txn.billing_cycle,
    });

    return NextResponse.redirect(`${billingUrl}?payment=success`);
  } catch (error) {
    console.error(`[Khalti Verify] Fatal error:`, error);
    return NextResponse.redirect(`${billingUrl}?payment=failed&reason=internal_error`);
  }
}
