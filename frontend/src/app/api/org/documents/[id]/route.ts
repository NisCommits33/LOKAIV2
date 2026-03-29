import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, organization_id, department_id")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.organization_id) {
    return NextResponse.json({ error: "Forbidden: Not part of an organization." }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("org_documents")
    .select("*, uploaded_by (full_name, email), department_id (name)")
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Authorization Check
  if (profile.role !== "org_admin" && profile.role !== "super_admin") {
    if (data.department_id && data.department_id !== profile.department_id) {
      return NextResponse.json({ error: "Forbidden: Document belongs to a different department." }, { status: 403 });
    }
    // Strip correct answers to prevent cheating
    if (data.questions && Array.isArray(data.questions)) {
       data.questions = data.questions.map((q: any) => {
          const { correct_answer, explanation, ...safeQ } = q;
          return safeQ;
       });
    }
  }

  return NextResponse.json(data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "org_admin") {
    return NextResponse.json({ error: "Forbidden: Org Admin required to update org docs" }, { status: 403 });
  }

  const body = await request.json();
  const { title, description, policy_tag, chapter_tag, section_tag, department_id } = body;

  const updatePayload: any = {};
  if (title !== undefined) updatePayload.title = title;
  if (description !== undefined) updatePayload.description = description;
  
  if (policy_tag !== undefined) updatePayload.policy_tag = policy_tag === "none" ? null : policy_tag;
  if (chapter_tag !== undefined) updatePayload.chapter_tag = chapter_tag === "none" ? null : chapter_tag;
  if (section_tag !== undefined) updatePayload.section_tag = section_tag === "none" ? null : section_tag;
  if (department_id !== undefined) updatePayload.department_id = (department_id === "none" || department_id === "all") ? null : department_id;

  const { data, error } = await supabase
    .from("org_documents")
    .update(updatePayload)
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "org_admin") {
    return NextResponse.json({ error: "Forbidden: Org Admin required to delete org docs" }, { status: 403 });
  }

  // Get file_path to delete from storage
  const { data: doc, error: fetchError } = await supabase
    .from("org_documents")
    .select("file_path")
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .single();

  if (fetchError || !doc) {
    return NextResponse.json({ error: fetchError?.message || "Document not found" }, { status: 404 });
  }

  // Delete from DB
  const { error: dbError } = await supabase
    .from("org_documents")
    .delete()
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  // Delete from Storage
  await supabase.storage.from("documents").remove([doc.file_path]);

  return NextResponse.json({ success: true });
}
