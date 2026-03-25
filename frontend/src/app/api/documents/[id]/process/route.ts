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

  // Parse optional language param
  let language = "eng";
  try {
    const body = await request.json();
    if (body.language) language = body.language;
  } catch {
    // No body — use defaults
  }

  // Fire-and-forget: run OCR in background, save results when done
  extractTextInBackground(id, base64, language);

  // Return immediately so the UI can start polling
  return NextResponse.json({ status: "processing", message: "Text extraction started" });
}

/** Runs OCR in the background and updates the document when done. */
async function extractTextInBackground(
  docId: string,
  base64: string,
  language: string,
) {
  const { createClient: createBgClient } = await import("@/lib/supabase/server");
  const supabase = await createBgClient();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 300000); // 5 min

    let aiResponse: Response;
    try {
      aiResponse = await fetch(`${AI_BACKEND_URL}/api/ai/ocr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_base64: base64,
          language,
        }),
        signal: controller.signal,
      });
    } catch {
      clearTimeout(timeout);
      throw new Error(
        `AI backend is not reachable at ${AI_BACKEND_URL}. Make sure the FastAPI server is running.`
      );
    }

    clearTimeout(timeout);

    if (!aiResponse.ok) {
      const errorData = await aiResponse.json().catch(() => ({}));
      throw new Error(
        (errorData as { detail?: string }).detail ||
          `AI backend returned ${aiResponse.status}`
      );
    }

    const result = (await aiResponse.json()) as {
      text: string;
      page_count: number;
      language: string;
      confidence: number;
    };

    // Save extracted text only — summary and questions are generated on-demand
    await supabase
      .from("personal_documents")
      .update({
        extracted_text: result.text,
        processing_status: "completed",
        processed_at: new Date().toISOString(),
      })
      .eq("id", docId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Text extraction failed";
    await supabase
      .from("personal_documents")
      .update({ processing_status: "failed", processing_error: message })
      .eq("id", docId);
  }
}
