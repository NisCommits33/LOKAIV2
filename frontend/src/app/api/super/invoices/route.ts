/**
 * Super Admin Invoice Management
 *
 * GET  /api/super/invoices — List all invoices (filterable)
 * POST /api/super/invoices — Create a new invoice for an organization
 *
 * @module api/super/invoices
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

export async function GET(request: NextRequest) {
  const user = await verifySuperAdmin();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("org_id");
  const status = searchParams.get("status");

  const admin = createAdminClient();
  let query = admin
    .from("invoices")
    .select("*, organization:organizations(id, name)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (orgId) query = query.eq("organization_id", orgId);
  if (status && status !== "all") query = query.eq("status", status);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ invoices: data || [] });
}

export async function POST(request: NextRequest) {
  const user = await verifySuperAdmin();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const {
    organizationId,
    subscriptionId,
    amount,
    taxAmount = 0,
    dueDays = 30,
    purchaseOrderNumber,
    notes,
  } = body;

  if (!organizationId || !amount) {
    return NextResponse.json(
      { error: "organizationId and amount are required" },
      { status: 400 }
    );
  }

  if (typeof amount !== "number" || amount <= 0) {
    return NextResponse.json(
      { error: "amount must be a positive number" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Verify org exists
  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("id", organizationId)
    .single();

  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  // Generate invoice number
  const { data: invoiceNumber } = await admin.rpc("generate_invoice_number");

  const issueDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + dueDays);

  const totalAmount = amount + (taxAmount || 0);

  const { data: invoice, error: insertError } = await admin
    .from("invoices")
    .insert({
      organization_id: organizationId,
      subscription_id: subscriptionId || null,
      invoice_number: invoiceNumber,
      amount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      issue_date: issueDate.toISOString().split("T")[0],
      due_date: dueDate.toISOString().split("T")[0],
      status: "draft",
      purchase_order_number: purchaseOrderNumber || null,
      notes: notes || null,
      created_by: user.id,
    })
    .select("*, organization:organizations(id, name)")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ invoice }, { status: 201 });
}
