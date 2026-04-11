/**
 * api/documents/upload/route.ts — Document Upload API
 *
 * POST /api/documents/upload
 * Accepts a multipart form upload (PDF only, max 50 MB).
 * Stores the file in Supabase Storage and creates a personal_documents record.
 *
 * @module api/documents/upload
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_MIME = "application/pdf";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const title = (formData.get("title") as string) || "";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.type !== ALLOWED_MIME) {
    return NextResponse.json(
      { error: "Only PDF files are allowed" },
      { status: 400 }
    );
  }

  // Security Hardening: Validate magic bytes (signature)
  // PDF files must start with '%PDF-' (hex: 25 50 44 46 2d)
  const headerBuffer = await file.slice(0, 5).arrayBuffer();
  const header = Buffer.from(headerBuffer).toString("utf-8");
  if (header !== "%PDF-") {
    return NextResponse.json(
      { error: "Invalid file content: The file is not a valid PDF." },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File size exceeds 50 MB limit" },
      { status: 400 }
    );
  }

  // Build a unique storage path: documents/{user_id}/{timestamp}_{filename}
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${user.id}/${timestamp}_${safeName}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: `Upload failed: ${uploadError.message}` },
      { status: 500 }
    );
  }

  // Create a database record
  const docTitle = title.trim() || file.name.replace(/\.pdf$/i, "");

  const { data: doc, error: dbError } = await supabase
    .from("personal_documents")
    .insert({
      user_id: user.id,
      title: docTitle,
      file_path: filePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      processing_status: "pending",
    })
    .select()
    .single();

  if (dbError) {
    // Attempt to clean up the uploaded file
    await supabase.storage.from("documents").remove([filePath]);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(doc, { status: 201 });
}
