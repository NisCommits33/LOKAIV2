/**
 * invoice.ts — Auto-invoice creation after successful payment
 *
 * Generates an invoice record automatically when a payment transaction completes.
 *
 * @module lib/payments/invoice
 */

import { createAdminClient } from "@/lib/supabase/admin-client";

interface CreateInvoiceParams {
  organizationId: string;
  subscriptionId: string | null;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  gateway: "esewa" | "khalti";
  gatewayTransactionId: string | null;
  transactionId: string;
  planName: string;
  billingCycle: string;
}

/**
 * Auto-create a "paid" invoice after successful payment verification.
 * Returns the created invoice or null on failure.
 */
export async function createPaymentInvoice(params: CreateInvoiceParams) {
  const admin = createAdminClient();

  // Generate invoice number via DB function
  const { data: invoiceNumber } = await admin.rpc("generate_invoice_number");

  if (!invoiceNumber) return null;

  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];

  const { data: invoice } = await admin
    .from("invoices")
    .insert({
      organization_id: params.organizationId,
      subscription_id: params.subscriptionId,
      invoice_number: invoiceNumber,
      amount: params.amount,
      tax_amount: params.taxAmount,
      total_amount: params.totalAmount,
      issue_date: dateStr,
      due_date: dateStr, // Already paid, so due_date = issue_date
      status: "paid",
      notes: `Auto-generated for ${params.planName} (${params.billingCycle}) — paid via ${params.gateway.toUpperCase()}, Ref: ${params.gatewayTransactionId || params.transactionId}`,
    })
    .select()
    .single();

  return invoice || null;
}
