/**
 * api/admin/verifications/[id]/approve/route.ts — Approve Verification
 *
 * POST /api/admin/verifications/:id/approve
 * Sets a user's verification_status to 'verified', role to 'employee',
 * and records the approver and timestamp.
 *
 * Only org_admin users can approve, and only for users in their organization.
 *
 * @module api/admin/verifications/approve
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { verifyOrgAdmin } from "@/lib/supabase/admin";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: targetUserId } = await params;

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

  const adminClient = createAdminClient();

  // Verify the target user belongs to the admin's organization and is pending
  const { data: targetUser, error: fetchError } = await adminClient
    .from("users")
    .select("id, organization_id, verification_status")
    .eq("id", targetUserId)
    .single();

  if (fetchError || !targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (targetUser.organization_id !== organizationId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (targetUser.verification_status !== "pending") {
    return NextResponse.json(
      { error: "User is not in pending verification status" },
      { status: 400 }
    );
  }

  // Approve: set verified, role=employee, record approver
  const { data, error } = await adminClient
    .from("users")
    .update({
      verification_status: "verified",
      role: "employee",
      verified_at: new Date().toISOString(),
      verified_by: user.id,
      rejection_reason: null,
      rejected_by: null,
      rejected_at: null,
    })
    .eq("id", targetUserId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
