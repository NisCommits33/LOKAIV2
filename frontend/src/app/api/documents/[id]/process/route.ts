/**
 * api/documents/[id]/process/route.ts — Trigger OCR Text Extraction
 *
 * POST /api/documents/:id/process
 * Downloads the PDF from storage, sends base64 to FastAPI /api/ai/ocr,
 * saves extracted_text back to the document.
 * Returns immediately — OCR runs in the background, poll for updates.
 *
 * @module api/documents/[id]/process
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const AI_BACKEND_URL = process.env.AI_BACKEND_URL || "http://localhost:8000";

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

  // Fetch document
  const { data: doc, error: fetchError } = await supabase
    .from("personal_documents")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (doc.processing_status === "processing") {
    return NextResponse.json({ status: "processing", message: "Already processing" });
  }

  // Set status to processing
  await supabase
    .from("personal_documents")
    .update({ processing_status: "processing", processing_error: null })
    .eq("id", id);

  // Download file from Supabase Storage
  const { data: fileData, error: downloadError } = await supabase.storage
    .from("documents")
    .download(doc.file_path);

  if (downloadError || !fileData) {
    await supabase
      .from("personal_documents")
      .update({
        processing_status: "failed",
        processing_error: `Failed to download file: ${downloadError?.message ?? "no data"}`,
      })
      .eq("id", id);
    return NextResponse.json(
      { error: "Failed to download file from storage" },
      { status: 500 }
    );
  }

  // Convert to base64
  const arrayBuffer = await fileData.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  // Parse optional params
  let language = "eng+nep";
  let engine_preference = "local";
  let question_count = 5;
  let difficulty = "medium";
  
  try {
    const body = await request.json();
    if (body.language) language = body.language;
    if (body.engine_preference) engine_preference = body.engine_preference;
    if (body.question_count) question_count = body.question_count;
    if (body.difficulty) difficulty = body.difficulty;
  } catch {
    // Use defaults
  }

  // Fire-and-forget: run full pipeline in background
  runFullPipelineInBackground(id, base64, language, engine_preference, question_count, difficulty);

  // Return immediately so the UI can start polling
  return NextResponse.json({ 
    status: "processing", 
    message: `Processing started using ${engine_preference} engine.` 
  });
}

/** Runs the full AI pipeline in the background on the FastAPI backend. */
async function runFullPipelineInBackground(
  docId: string,
  base64: string,
  language: string,
  engine_preference: string,
  question_count: number,
  difficulty: string
) {
  const { createClient: createBgClient } = await import("@/lib/supabase/server");
  const supabase = await createBgClient();

  try {
    // Call the NEW /api/ai/process endpoint (Full Pipeline)
    const aiResponse = await fetch(`${AI_BACKEND_URL}/api/ai/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doc_id: docId,
        file_base64: base64,
        language,
        engine_preference,
        question_count,
        difficulty,
        tasks: ["extract", "summarize", "questions"] // Run the full suite for a complete experience
      }),
    });

    if (!aiResponse.ok) {
      const errorData = await aiResponse.json().catch(() => ({}));
      throw new Error((errorData as { detail?: string }).detail || `AI backend returned ${aiResponse.status}`);
    }

    // Since /api/ai/process is now asynchronous and returns immediately,
    // we don't need to wait for result here. The backend will update Supabase directly.
    console.log(`[Next.js API] Pipeline started for ${docId}`);

  } catch (err) {
    const message = err instanceof Error ? err.message : "Pipeline start failed";
    console.error(`[Next.js API Error] ${message}`);
    await supabase
      .from("personal_documents")
      .update({ processing_status: "failed", processing_error: message })
      .eq("id", docId);
  }
}
