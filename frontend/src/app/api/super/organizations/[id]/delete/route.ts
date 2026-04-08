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
    const orgId = application.organization_id;

    console.log(`[delete-org] Starting deep cleanup for organization: ${orgId}`);

    // 1. FIRST: Catch and reset all users while they are still linked
    // We do this first because deleting depts/levels might trigger cascades that nullify these links.
    const { data: members } = await adminClient
      .from("users")
      .select("id")
      .eq("organization_id", orgId);
    
    if (members && members.length > 0) {
      const uids = members.map(m => m.id);
      const { error: resetError } = await adminClient
        .from("users")
        .update({ 
          role: "public", 
          organization_id: null,
          department_id: null,
          job_level_id: null,
          employee_id: null,
          verification_status: "none",
          profile_completed: false 
        })
        .in("id", uids);
      
      if (resetError) {
        console.error("[delete-org] Failed to reset users:", resetError);
        return NextResponse.json({ error: "Failed to reset organization users" }, { status: 500 });
      }
      console.log(`[delete-org] Reset ${uids.length} users to public state`);
    }

    // 2. Progress & Analytics Cleanup
    await adminClient.from("user_progress").delete().eq("organization_id", orgId);
    await adminClient.from("usage_events").delete().eq("organization_id", orgId);
    await adminClient.from("audit_logs").delete().eq("organization_id", orgId);

    // 3. Billing & Payments Cleanup
    await adminClient.from("subscription_usage").delete().eq("organization_id", orgId);
    await adminClient.from("manual_payments").delete().eq("organization_id", orgId);
    await adminClient.from("payment_transactions").delete().eq("organization_id", orgId);
    await adminClient.from("invoices").delete().eq("organization_id", orgId);

    // 4. Documents & Storage Purge
    const { data: docs } = await adminClient
      .from("org_documents")
      .select("file_path")
      .eq("organization_id", orgId);
    
    if (docs && docs.length > 0) {
      const paths = docs.map(d => d.file_path);
      await adminClient.storage.from("documents").remove(paths);
      console.log(`[delete-org] Purged ${paths.length} files from storage`);
    }
    await adminClient.from("org_documents").delete().eq("organization_id", orgId);

    // 5. Structure & Subscription Cleanup
    await adminClient.from("departments").delete().eq("organization_id", orgId);
    await adminClient.from("job_levels").delete().eq("organization_id", orgId);
    await adminClient.from("organization_subscriptions").delete().eq("organization_id", orgId);

    // 6. Delete the Actual Organization record
    const { error: orgError } = await adminClient
      .from("organizations")
      .delete()
      .eq("id", orgId);

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
