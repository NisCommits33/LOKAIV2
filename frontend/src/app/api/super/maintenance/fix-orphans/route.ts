import { createAdminClient } from "@/lib/supabase/admin-client";
import { NextResponse } from "next/server";

/**
 * GET /api/super/maintenance/fix-orphans
 * ONE-TIME FIX: Resets users who are "verified" but have no organization_id (orphaned).
 */
export async function GET() {
  const adminClient = createAdminClient();

  try {
    // 1. Find all users who are "Verified" or "Admins" but have no organization link
    const { data: orphans, error: fetchError } = await adminClient
      .from("users")
      .select("id, email, full_name")
      .is("organization_id", null)
      .or("role.eq.org_admin,role.eq.employee,verification_status.eq.verified")
      .neq("role", "super_admin");

    if (fetchError) throw fetchError;

    if (!orphans || orphans.length === 0) {
      return NextResponse.json({ message: "No orphaned users found. System is clean." });
    }

    // 2. Deep Reset these users so they can join a new org
    const uids = orphans.map(o => o.id);
    const { error: updateError } = await adminClient
      .from("users")
      .update({
        role: "public",
        verification_status: "none",
        profile_completed: false,
        department_id: null,
        job_level_id: null,
        employee_id: null
      })
      .in("id", uids);

    if (updateError) throw updateError;

    console.log(`[maintenance] Fixed ${uids.length} orphaned users:`, orphans.map(o => o.email));

    return NextResponse.json({
      message: `Successfully fixed ${uids.length} orphaned users.`,
      fixed_users: orphans
    });
  } catch (err: any) {
    console.error("[maintenance] Orphan fix failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
