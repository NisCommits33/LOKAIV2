import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Check if user is an admin
  const { data: profile } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "org_admin" && profile.role !== "super_admin")) {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  // 2. Parse request body
  try {
    const { is_published, target_department_id, target_job_level_id, create_new_version, difficulty_level, num_questions } = await request.json();

    // 3. Fetch original document to duplicate if creating a new version
    const { data: original, error: fetchError } = await supabase
      .from("org_documents")
      .select("*")
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .single();

    if (fetchError || !original) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (create_new_version) {
      // Create a duplicate with the new publishing settings
      const { id: _, created_at: __, ...payload } = original;
      const { data: duplicated, error: dupError } = await supabase
        .from("org_documents")
        .insert({
          ...payload,
          title: `${original.title} (Quiz Version ${new Date().toLocaleDateString()})`,
          is_published: !!is_published,
          published_at: is_published ? new Date().toISOString() : null,
          target_department_id: target_department_id || null,
          target_job_level_id: target_job_level_id || null,
          difficulty_level: difficulty_level || "medium",
          num_questions: num_questions || 5,
          processing_status: "completed", // Keep it as completed since we're just copying content to a new card
        })
        .select()
        .single();

      if (dupError) {
        console.error("Duplication error:", dupError);
        return NextResponse.json({ error: "Failed to create new quiz version" }, { status: 500 });
      }

      return NextResponse.json(duplicated);
    }

    // Standard update
    const { data: updated, error } = await supabase
      .from("org_documents")
      .update({
        is_published: !!is_published,
        published_at: is_published ? new Date().toISOString() : null,
        target_department_id: target_department_id || null,
        target_job_level_id: target_job_level_id || null,
        difficulty_level: difficulty_level || "medium",
        num_questions: num_questions || 5,
      })
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .select()
      .single();

    if (error) {
      console.error("Publish error:", error);
      return NextResponse.json({ error: "Failed to update document status" }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
