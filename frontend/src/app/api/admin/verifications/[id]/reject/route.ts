/**
 * api/admin/verifications/[id]/reject/route.ts — Reject Verification
 *
 * POST /api/admin/verifications/:id/reject
 * Sets a user's verification_status to 'rejected' with a reason,
 * and records the rejector and timestamp.
 *
 * Only org_admin users can reject, and only for users in their organization.
 *
 * @module api/admin/verifications/reject
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

  const body = await request.json();
  const reason = body.reason?.trim();

  if (!reason) {
    return NextResponse.json(
      { error: "Rejection reason is required" },
      { status: 400 }
    );
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

  // Reject: set rejected, store reason and rejector
  const { data, error } = await adminClient
    .from("users")
    .update({
      verification_status: "rejected",
      rejection_reason: reason,
      rejected_by: user.id,
      rejected_at: new Date().toISOString(),
      verified_at: null,
      verified_by: null,
    })
    .eq("id", targetUserId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
