import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/organizations/apply
 * Creates a new organization registration application.
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
  } = body as Record<string, string | unknown>;

  // Validate required fields
  if (!name || !code || !contact_email || !applicant_name || !applicant_email) {
    return NextResponse.json(
      { error: "Missing required fields: name, code, contact_email, applicant_name, applicant_email" },
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
