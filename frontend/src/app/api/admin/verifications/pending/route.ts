/**
 * api/admin/verifications/pending/route.ts — Pending Verifications API
 *
 * GET /api/admin/verifications/pending
 * Lists all users with verification_status='pending' in the org admin's organization.
 * Returns user details with joined department and job level info.
 *
 * Requires organization role. Scoped to the admin's own organization.
 *
 * @module api/admin/verifications/pending
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { verifyOrgAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { isAdmin, organizationId } = await verifyOrgAdmin(supabase, user.id);
  if (!isAdmin || !organizationId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Use admin client to bypass RLS for cross-user queries
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("users")
    .select(
      `
      id, email, full_name, avatar_url, employee_id,
      verification_status, created_at,
      department:departments(id, name, code),
      job_level:job_levels(id, name, level_order)
    `
    )
    .eq("organization_id", organizationId)
    .eq("verification_status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
