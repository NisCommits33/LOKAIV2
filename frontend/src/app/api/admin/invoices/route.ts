/**
 * Org Admin Invoice View
 *
 * GET /api/admin/invoices — View invoices for the logged-in org admin's organization
 *
 * @module api/admin/invoices
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { NextResponse } from "next/server";

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

  const admin = createAdminClient();

  // Invoices for this org
  const { data: invoices } = await admin
    .from("invoices")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false });

  // Payments for this org
  const { data: payments } = await admin
    .from("manual_payments")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("payment_date", { ascending: false });

  return NextResponse.json({
    invoices: invoices || [],
    payments: payments || [],
  });
}
