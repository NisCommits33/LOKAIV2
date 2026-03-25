import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { verifySuperAdmin } from "@/lib/supabase/admin";
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

  if (!(await verifySuperAdmin(supabase, user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Use admin client (bypasses RLS) for data operations
  const adminClient = createAdminClient();

  // Get the application
  const { data: application, error: fetchError } = await adminClient
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
  const { data: updated, error: updateError } = await adminClient
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
    let userId: string | null = null;

    // First check if public.users row exists (created by handle_new_user trigger on signUp)
    const { data: existingUser } = await adminClient
      .from("users")
      .select("id")
      .ilike("email", targetEmail)
      .maybeSingle();

    if (existingUser) {
      // Auth user + public.users row both exist — just confirm their email
      await adminClient.auth.admin.updateUserById(existingUser.id, {
        email_confirm: true,
      });
      userId = existingUser.id;
    } else {
      // Auth user doesn't exist (signUp failed during registration) — create one
      const tempPassword = crypto.randomUUID();
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: targetEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: application.applicant_name,
          name: application.applicant_name,
        },
      });

      if (createError || !newUser?.user) {
        console.error("Failed to create auth user:", createError?.message);
        return NextResponse.json(
          { ...updated, warning: "Approved but admin account creation failed. User must sign up manually." },
          { status: 200 }
        );
      }

      userId = newUser.user.id;

      // Send password reset so the user can set their own password
      await adminClient.auth.admin.generateLink({
        type: "recovery",
        email: targetEmail,
      });
    }

    // Ensure public.users row exists (trigger may have failed)
    const { data: targetUser } = await adminClient
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (!targetUser) {
      // Manually create the public.users row if the trigger didn't fire
      await adminClient.from("users").insert({
        id: userId,
        email: targetEmail,
        full_name: application.applicant_name,
        role: "org_admin",
        organization_id: updated.organization_id,
        verification_status: "verified",
        verified_at: new Date().toISOString(),
        verified_by: user.id,
        profile_completed: true,
      });
    } else {
      // Update existing public.users row
      await adminClient
        .from("users")
        .update({
          role: "org_admin",
          organization_id: updated.organization_id,
          verification_status: "verified",
          verified_at: new Date().toISOString(),
          verified_by: user.id,
          profile_completed: true,
        })
        .eq("id", userId);
    }
  }

  return NextResponse.json(updated);
}
