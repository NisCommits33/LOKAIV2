/**
 * api/documents/[id]/summarize/route.ts — On-Demand Summarization
 *
 * POST /api/documents/:id/summarize
 * Takes the already-extracted text and generates an AI summary via FastAPI.
 * Saves the summary back to the document.
 *
 * @module api/documents/[id]/summarize
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

  const { data: doc, error } = await supabase
    .from("personal_documents")
    .select("extracted_text, processing_status")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (doc.processing_status !== "completed" || !doc.extracted_text) {
    return NextResponse.json(
      { error: "Text has not been extracted yet" },
      { status: 400 }
    );
  }

  let engine = "local";
  let overrideText: string | null = null;
  try {
    const body = await request.json().catch(() => ({}));
    if (body.engine) engine = body.engine;
    if (body.text) overrideText = body.text;
  } catch {
    // No body or invalid JSON — use defaults
  }

  const textToProcess = overrideText || doc.extracted_text;

  try {
    const aiRes = await fetch(`${AI_BACKEND_URL}/api/ai/summarize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        text: textToProcess,
        engine 
      }),
      signal: AbortSignal.timeout(120000), // 2 min
    });

    if (!aiRes.ok) {
      const err = await aiRes.json().catch(() => ({}));
      throw new Error(
        (err as { detail?: string }).detail || `AI backend returned ${aiRes.status}`
      );
    }

    const result = (await aiRes.json()) as { summary: string };

    // Save summary to document only if it's the full document text
    if (!overrideText) {
      await supabase
        .from("personal_documents")
        .update({ ai_summary: result.summary })
        .eq("id", id);
    }

    return NextResponse.json({ summary: result.summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Summarization failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
