import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { verifySuperAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * GET /api/super/stats
 * Returns platform-wide statistics for the super admin dashboard.
 * Requires super_admin role.
 */
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await verifySuperAdmin(supabase, user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Use admin client (bypasses RLS) for data queries
  const adminClient = createAdminClient();

  const [orgsRes, usersRes, pendingRes, approvedRes, rejectedRes] =
    await Promise.all([
      adminClient
        .from("organizations")
        .select("*", { count: "exact", head: true }),
      adminClient
        .from("users")
        .select("*", { count: "exact", head: true }),
      adminClient
        .from("organization_applications")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      adminClient
        .from("organization_applications")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved"),
      adminClient
        .from("organization_applications")
        .select("*", { count: "exact", head: true })
        .eq("status", "rejected"),
    ]);

  return NextResponse.json({
    totalOrganizations: orgsRes.count ?? 0,
    totalUsers: usersRes.count ?? 0,
    pendingApplications: pendingRes.count ?? 0,
    approvedApplications: approvedRes.count ?? 0,
    rejectedApplications: rejectedRes.count ?? 0,
  });
}
