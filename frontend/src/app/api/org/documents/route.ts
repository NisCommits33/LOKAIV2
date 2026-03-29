import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_MIME = "application/pdf";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch the user's organization and role
  const { data: profile } = await supabase
    .from("users")
    .select("role, organization_id, department_id")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.organization_id) {
    return NextResponse.json({ error: "Forbidden: Not part of an organization." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const departmentId = searchParams.get("department_id");
  const policyTag = searchParams.get("policy_tag");
  const processingStatus = searchParams.get("status");
  
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  // View filtering. If org_admin, they see all. If employee, they only see documents 
  // linked to their department OR documents with no specific department mapping (org-wide).
  let query = supabase
    .from("org_documents")
    .select("id, title, description, file_name, file_size, processing_status, department_id, policy_tag, chapter_tag, created_at, processed_at", { count: "exact" })
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (profile.role !== "org_admin" && profile.role !== "super_admin") {
    // Regular employees see documents that apply to them
    if (profile.department_id) {
      query = query.or(`department_id.eq.${profile.department_id},department_id.is.null`);
    } else {
       query = query.is("department_id", null);
    }
  }

  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  // Explicit filter applied from UI
  if (departmentId && departmentId !== "all") {
    query = query.eq("department_id", departmentId);
  }

  if (policyTag && policyTag !== "all") {
    query = query.eq("policy_tag", policyTag);
  }

  if (processingStatus && processingStatus !== "all") {
    query = query.eq("processing_status", processingStatus);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ documents: data, total: count ?? 0 });
}


export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "org_admin") {
    return NextResponse.json({ error: "Forbidden: Org Admin required to upload org docs" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const title = (formData.get("title") as string) || "";
  const description = (formData.get("description") as string) || "";
  
  // Taxonomies
  const policy_tag = formData.get("policy_tag") as string | null;
  const chapter_tag = formData.get("chapter_tag") as string | null;
  const section_tag = formData.get("section_tag") as string | null;
  const department_id = formData.get("department_id") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.type !== ALLOWED_MIME) {
    return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File size exceeds 50 MB limit" }, { status: 400 });
  }

  // Save to Storage: orgs/{org_id}/{timestamp}_{safeName}
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `org_documents/${profile.organization_id}/${timestamp}_${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("documents") // REUSING existing storage bucket
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
  }

  const docTitle = title.trim() || file.name.replace(/\.pdf$/i, "");

  const insertPayload: any = {
    organization_id: profile.organization_id,
    uploaded_by: user.id,
    title: docTitle,
    description: description.trim() || null,
    file_path: filePath,
    file_name: file.name,
    file_size: file.size,
    processing_status: "pending",
  };

  if (policy_tag && policy_tag !== "none") insertPayload.policy_tag = policy_tag;
  if (chapter_tag && chapter_tag !== "none") insertPayload.chapter_tag = chapter_tag;
  if (section_tag && section_tag !== "none") insertPayload.section_tag = section_tag;
  if (department_id && department_id !== "all" && department_id !== "none") insertPayload.department_id = department_id;

  const { data: doc, error: dbError } = await supabase
    .from("org_documents")
    .insert(insertPayload)
    .select()
    .single();

  if (dbError) {
    await supabase.storage.from("documents").remove([filePath]);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(doc, { status: 201 });
}
