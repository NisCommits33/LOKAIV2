/**
 * api/documents/[id]/route.ts — Single Document API
 *
 * GET    /api/documents/:id — Full document details
 * PUT    /api/documents/:id — Update title, description
 * DELETE /api/documents/:id — Delete document + storage file
 *
 * @module api/documents/[id]
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
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

  const { data: doc, error } = await supabase
    .from("personal_documents")
    .select("id, title, description, file_path, file_name, file_size, mime_type, processing_status, processing_error, ai_summary, questions, created_at, updated_at, processed_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Generate a signed URL for file download (valid 1 hour)
  const { data: signedUrlData } = await supabase.storage
    .from("documents")
    .createSignedUrl(doc.file_path, 3600);

  return NextResponse.json({
    ...doc,
    download_url: signedUrlData?.signedUrl ?? null,
  });
}

export async function PUT(
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

  const body = await request.json();
  const { title, description } = body as {
    title?: string;
    description?: string;
  };

  const updates: Record<string, string> = {};
  if (title !== undefined) updates.title = title.trim();
  if (description !== undefined) updates.description = description.trim();

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data: doc, error } = await supabase
    .from("personal_documents")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("[API Error] Document update failed:", error.message);
    return NextResponse.json({ error: "Failed to update document due to an internal error." }, { status: 500 });
  }

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return NextResponse.json(doc);
}

export async function DELETE(
  _request: Request,
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

  // Fetch doc to get file_path before deleting
  const { data: doc, error: fetchError } = await supabase
    .from("personal_documents")
    .select("file_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Delete from storage
  await supabase.storage.from("documents").remove([doc.file_path]);

  // Delete from database
  const { error: deleteError } = await supabase
    .from("personal_documents")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (deleteError) {
    console.error("[API Error] Document deletion failed:", deleteError.message);
    return NextResponse.json({ error: "Failed to delete document due to an internal error." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
