import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // We fetch tags for the user's organization. Any employee can read tags.
  const { data: profile } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.organization_id) {
    return NextResponse.json({ error: "No organization associated with user." }, { status: 403 });
  }

  // Fetch all tags. The UI will optionally group them by type (policy vs chapter) and parent_id
  const { data, error } = await supabase
    .from("document_tags")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only org_admins can CREATE new document tags
  const { data: profile } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "org_admin") {
    return NextResponse.json({ error: "Forbidden: Org Admin required to create tags" }, { status: 403 });
  }

  const body = await request.json();
  const { type, name, parent_id } = body;

  if (!["policy", "chapter", "section"].includes(type) || !name?.trim()) {
    return NextResponse.json({ error: "Valid type (policy|chapter|section) and name are required." }, { status: 400 });
  }

  const insertData: any = {
    organization_id: profile.organization_id,
    type,
    name: name.trim()
  };

  if (parent_id) {
    insertData.parent_id = parent_id;
  }

  const { data, error } = await supabase
    .from("document_tags")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
