/**
 * GET /api/admin/billing/verify — eSewa payment verification callback
 *
 * eSewa redirects here after successful payment with base64-encoded data.
 * Verifies the payment, updates the transaction, and activates the subscription.
 *
 * @module api/admin/billing/verify
 */

import { createAdminClient } from "@/lib/supabase/admin-client";
import { NextResponse, type NextRequest } from "next/server";
import { verifyEsewaPayment } from "@/lib/payments/esewa";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const encodedData = searchParams.get("data");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!encodedData) {
    return NextResponse.redirect(`${appUrl}/admin/billing?payment=failed&reason=no_data`);
  }

  const result = await verifyEsewaPayment(encodedData);

  if (!result.success || !result.data) {
    return NextResponse.redirect(
      `${appUrl}/admin/billing?payment=failed&reason=${encodeURIComponent(result.error || "verification_failed")}`
    );
  }

  const admin = createAdminClient();
  const { transaction_uuid, transaction_code, status, total_amount } = result.data;
  // ref_id comes from the status check API cross-verification
  const refId = result.statusData?.ref_id || transaction_code;

  // Find the pending transaction
  const { data: txn, error: txnErr } = await admin
    .from("payment_transactions")
    .select("*, plan:subscription_plans(*)")
    .eq("transaction_uuid", transaction_uuid)
    .eq("status", "initiated")
    .single();

  if (txnErr || !txn) {
    return NextResponse.redirect(`${appUrl}/admin/billing?payment=failed&reason=transaction_not_found`);
  }

  // Verify amount matches
  if (Number(total_amount) !== txn.total_amount) {
    await admin
      .from("payment_transactions")
      .update({
        status: "failed",
        failure_reason: `Amount mismatch: expected ${txn.total_amount}, got ${total_amount}`,
        raw_response: result.data as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      })
      .eq("id", txn.id);

    return NextResponse.redirect(`${appUrl}/admin/billing?payment=failed&reason=amount_mismatch`);
  }

  // Mark transaction as completed
  await admin
    .from("payment_transactions")
    .update({
      status: "completed",
      gateway_transaction_id: refId,
      gateway_status: status,
      raw_response: result.data as unknown as Record<string, unknown>,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", txn.id);

  // Calculate subscription period
  const now = new Date();
  const periodEnd = new Date(now);
  if (txn.billing_cycle === "yearly") {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  // Deactivate any existing active subscription
  await admin
    .from("organization_subscriptions")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .eq("organization_id", txn.organization_id)
    .eq("status", "active");

  // Create the new active subscription
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

  // Link the subscription to the transaction
  if (newSub) {
    await admin
      .from("payment_transactions")
      .update({ subscription_id: newSub.id })
      .eq("id", txn.id);
  }

  return NextResponse.redirect(`${appUrl}/admin/billing?payment=success`);
}
