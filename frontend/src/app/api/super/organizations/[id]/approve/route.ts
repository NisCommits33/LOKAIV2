import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/super/organizations/[id]/approve
 * Approves a pending organization application.
 * The database trigger auto-creates the org, default depts, and job levels.
 * Optionally assigns an admin user (applicant or custom email).
 * Requires super_admin role.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify super_admin role
  const { data: dbUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (dbUser?.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get the application
  const { data: application, error: fetchError } = await supabase
    .from("organization_applications")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  if (application.status !== "pending") {
    return NextResponse.json(
      { error: `Application already ${application.status}` },
      { status: 400 }
    );
  }

  // Parse optional body for admin assignment
  let adminEmail: string | null = null;
  try {
    const body = await request.json();
    adminEmail = body.admin_email || null;
  } catch {
    // No body is fine — defaults to applicant email
  }

  // Approve the application (trigger creates org + defaults)
  const { data: updated, error: updateError } = await supabase
    .from("organization_applications")
    .update({
      status: "approved",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*, organization_id")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Assign admin role to the applicant or specified user
  const targetEmail = adminEmail || application.applicant_email;
  if (targetEmail && updated.organization_id) {
    const { data: targetUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", targetEmail)
      .maybeSingle();

    if (targetUser) {
      await supabase
        .from("users")
        .update({
          role: "org_admin",
          organization_id: updated.organization_id,
          verification_status: "verified",
          verified_at: new Date().toISOString(),
          verified_by: user.id,
          profile_completed: true,
        })
        .eq("id", targetUser.id);
    }
  }

  return NextResponse.json(updated);
}
