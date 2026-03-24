import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/super/organizations/[id]/assign-admin
 * Assigns a user as org_admin for the organization created from an approved application.
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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email } = body;
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  // Get the application and its created organization
  const { data: application } = await supabase
    .from("organization_applications")
    .select("status, organization_id")
    .eq("id", id)
    .single();

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  if (application.status !== "approved" || !application.organization_id) {
    return NextResponse.json(
      { error: "Application must be approved before assigning admin" },
      { status: 400 }
    );
  }

  // Find user by email
  const { data: targetUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", email as string)
    .maybeSingle();

  if (!targetUser) {
    return NextResponse.json(
      { error: "No user found with this email" },
      { status: 404 }
    );
  }

  // Assign org_admin role
  const { error: updateError } = await supabase
    .from("users")
    .update({
      role: "org_admin",
      organization_id: application.organization_id,
      verification_status: "verified",
      verified_at: new Date().toISOString(),
      verified_by: user.id,
      profile_completed: true,
    })
    .eq("id", targetUser.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, user_id: targetUser.id });
}
