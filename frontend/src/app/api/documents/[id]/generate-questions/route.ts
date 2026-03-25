/**
 * api/documents/[id]/generate-questions/route.ts — On-Demand Quiz Generation
 *
 * POST /api/documents/:id/generate-questions
 * Takes the already-extracted text and generates quiz questions via FastAPI.
 * Saves the questions back to the document.
 *
 * @module api/documents/[id]/generate-questions
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

  // Parse optional params
  let count = 5;
  let difficulty = "medium";
  try {
    const body = await request.json();
    if (body.count) count = Math.min(Math.max(body.count, 1), 20);
    if (body.difficulty) difficulty = body.difficulty;
  } catch {
    // No body — use defaults
  }

  try {
    const aiRes = await fetch(`${AI_BACKEND_URL}/api/ai/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: doc.extracted_text,
        count,
        difficulty,
      }),
      signal: AbortSignal.timeout(120000), // 2 min
    });

    if (!aiRes.ok) {
      const err = await aiRes.json().catch(() => ({}));
      throw new Error(
        (err as { detail?: string }).detail || `AI backend returned ${aiRes.status}`
      );
    }

    const result = (await aiRes.json()) as { questions: unknown[] };

    // Save questions to document
    await supabase
      .from("personal_documents")
      .update({ questions: result.questions })
      .eq("id", id);

    return NextResponse.json({ questions: result.questions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Question generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
