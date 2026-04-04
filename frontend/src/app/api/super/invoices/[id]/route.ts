/**
 * Super Admin Individual Invoice Management
 *
 * PUT  /api/super/invoices/[id] — Update invoice status (send, mark paid, cancel)
 * POST /api/super/invoices/[id] — Record a manual payment against this invoice
 *
 * @module api/super/invoices/[id]
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { NextResponse, type NextRequest } from "next/server";

async function verifySuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "super_admin") return null;
  return user;
}

/**
 * PUT — Update invoice status
 * Body: { status: 'sent' | 'paid' | 'overdue' | 'cancelled' }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifySuperAdmin();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  const validStatuses = ["draft", "sent", "paid", "overdue", "cancelled"];
  if (!status || !validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${validStatuses.join(", ")}` },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { data: invoice, error } = await admin
    .from("invoices")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, organization:organizations(id, name)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ invoice });
}

/**
 * POST — Record a manual payment for this invoice
 * Body: { amount, paymentMethod, referenceNumber?, notes? }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifySuperAdmin();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: invoiceId } = await params;
  const body = await request.json();
  const { amount, paymentMethod, referenceNumber, notes, paymentDate } = body;

  if (!amount || !paymentMethod) {
    return NextResponse.json(
      { error: "amount and paymentMethod are required" },
      { status: 400 }
    );
  }

  const validMethods = ["bank_transfer", "cheque", "cash", "online", "other"];
  if (!validMethods.includes(paymentMethod)) {
    return NextResponse.json(
      { error: `paymentMethod must be one of: ${validMethods.join(", ")}` },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Verify invoice exists
  const { data: invoice } = await admin
    .from("invoices")
    .select("id, organization_id, total_amount, status")
    .eq("id", invoiceId)
    .single();

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  // Record payment
  const { data: payment, error: payError } = await admin
    .from("manual_payments")
    .insert({
      invoice_id: invoiceId,
      organization_id: invoice.organization_id,
      amount,
      payment_date: paymentDate || new Date().toISOString().split("T")[0],
      payment_method: paymentMethod,
      reference_number: referenceNumber || null,
      notes: notes || null,
      recorded_by: user.id,
    })
    .select()
    .single();

  if (payError) {
    return NextResponse.json({ error: payError.message }, { status: 500 });
  }

  // Auto-mark invoice as paid if payment covers the total
  const { data: allPayments } = await admin
    .from("manual_payments")
    .select("amount")
    .eq("invoice_id", invoiceId);

  const totalPaid = (allPayments || []).reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );

  if (totalPaid >= Number(invoice.total_amount)) {
    await admin
      .from("invoices")
      .update({ status: "paid", updated_at: new Date().toISOString() })
      .eq("id", invoiceId);
  }

  return NextResponse.json({ payment }, { status: 201 });
}
