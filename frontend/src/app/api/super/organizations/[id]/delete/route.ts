import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { verifySuperAdmin } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * DELETE /api/super/organizations/[id]/delete
 * Permanently deletes an approved organization and its application.
 * Cascades to departments, job_levels, audit_logs, org_documents, subscriptions.
 * Users in the org get organization_id set to NULL.
 * Requires super_admin role.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await verifySuperAdmin(supabase, user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const adminClient = createAdminClient();

  // The id param is the application id — look up the linked organization
  const { data: application } = await adminClient
    .from("organization_applications")
    .select("id, name, status, organization_id")
    .eq("id", id)
    .single();

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  // Delete the actual organization if it was approved and linked
  if (application.organization_id) {
    // Reset org users to employee role before deleting the org
    const { error: usersError } = await adminClient
      .from("users")
      .update({ role: "employee", organization_id: null })
      .eq("organization_id", application.organization_id);

    if (usersError) {
      console.error("[delete-org] Failed to reset users:", usersError);
      return NextResponse.json({ error: "Failed to reset organization users" }, { status: 500 });
    }

    // Delete the organization (cascades to departments, job_levels, audit_logs, etc.)
    const { error: orgError } = await adminClient
      .from("organizations")
      .delete()
      .eq("id", application.organization_id);

    if (orgError) {
      console.error("[delete-org] Failed to delete organization:", orgError);
      return NextResponse.json({ error: orgError.message }, { status: 500 });
    }
  }

  // Delete the application record itself
  const { error: appError } = await adminClient
    .from("organization_applications")
    .delete()
    .eq("id", id);

  if (appError) {
    console.error("[delete-org] Failed to delete application:", appError);
    return NextResponse.json({ error: appError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, name: application.name });
}
