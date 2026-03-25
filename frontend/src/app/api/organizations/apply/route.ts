import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/organizations/apply
 * Creates a new organization registration application and
 * an auth account for the applicant (with email unconfirmed
 * so login is blocked until super admin approves).
 * No authentication required — public endpoint.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    name,
    code,
    description,
    address,
    contact_email,
    contact_phone,
    website,
    applicant_name,
    applicant_email,
    applicant_position,
    applicant_phone,
    documents,
    password,
  } = body as Record<string, string | unknown>;

  // Validate required fields
  if (!name || !code || !contact_email || !applicant_name || !applicant_email || !password) {
    return NextResponse.json(
      { error: "Missing required fields: name, code, contact_email, applicant_name, applicant_email, password" },
      { status: 400 }
    );
  }

  // Check if org code is already taken (active org or pending application)
  const { data: existingOrg } = await supabase
    .from("organizations")
    .select("id")
    .eq("code", code as string)
    .maybeSingle();

  if (existingOrg) {
    return NextResponse.json(
      { error: "Organization code is already in use" },
      { status: 409 }
    );
  }

  const { data: existingApp } = await supabase
    .from("organization_applications")
    .select("id")
    .eq("code", code as string)
    .eq("status", "pending")
    .maybeSingle();

  if (existingApp) {
    return NextResponse.json(
      { error: "A pending application with this code already exists" },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("organization_applications")
    .insert({
      name: name as string,
      code: code as string,
      description: (description as string) || null,
      address: (address as string) || null,
      contact_email: contact_email as string,
      contact_phone: (contact_phone as string) || null,
      website: (website as string) || null,
      applicant_name: applicant_name as string,
      applicant_email: applicant_email as string,
      applicant_position: (applicant_position as string) || null,
      applicant_phone: (applicant_phone as string) || null,
      documents: (documents as unknown) || [],
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("[apply] Application insert failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log("[apply] Application saved:", data.id, "for email:", applicant_email);

  // Create auth account server-side using admin client (reliable, bypasses client-side auth issues)
  const adminClient = createAdminClient();
  console.log("[apply] Creating auth user for:", applicant_email);

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: applicant_email as string,
    password: password as string,
    email_confirm: false, // Stays unconfirmed until super admin approves
    user_metadata: {
      full_name: applicant_name as string,
      name: applicant_name as string,
    },
  });

  if (authError) {
    console.error("[apply] Auth account creation FAILED:", authError.message);
    // Application is already saved — don't fail the whole request
    return NextResponse.json(
      { ...data, warning: `Application saved but account creation failed: ${authError.message}` },
      { status: 201 }
    );
  }

  console.log("[apply] Auth user created:", authData.user?.id, "email:", authData.user?.email);

  // Verify the trigger created a public.users row
  const { data: publicUser, error: publicUserError } = await adminClient
    .from("users")
    .select("id, email, role")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (publicUser) {
    console.log("[apply] public.users row confirmed:", publicUser.id, publicUser.email, publicUser.role);
  } else {
    console.error("[apply] public.users row NOT found after createUser. Trigger may have failed.", publicUserError?.message);
    // Manually create the public.users row as fallback
    const { error: insertError } = await adminClient.from("users").insert({
      id: authData.user.id,
      email: applicant_email as string,
      full_name: applicant_name as string,
    });
    if (insertError) {
      console.error("[apply] Manual public.users insert also failed:", insertError.message);
    } else {
      console.log("[apply] Manually created public.users row for:", authData.user.id);
    }
  }

  return NextResponse.json(data, { status: 201 });
}
