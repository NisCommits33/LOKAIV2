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

  const { data: profile } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "org_admin") {
    return NextResponse.json({ error: "Forbidden: Org Admin required" }, { status: 403 });
  }

  const { data: doc, error } = await supabase
    .from("org_documents")
    .select("extracted_text, processing_status")
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .single();

  if (error || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (!doc.extracted_text) {
    return NextResponse.json(
      { error: "Text has not been extracted yet. Please wait for OCR to finish." },
      { status: 400 }
    );
  }

  let count = 5;
  let difficulty = "medium";
  let engine = "local";
  let overrideText: string | null = null;
  try {
    const body = await request.json().catch(() => ({}));
    if (body.count) count = Math.min(Math.max(body.count, 1), 20);
    if (body.difficulty) difficulty = body.difficulty;
    if (body.engine) engine = body.engine;
    if (body.text) overrideText = body.text;
  } catch {
    // No body or invalid JSON — use defaults
  }

  const textToProcess = overrideText || doc.extracted_text;

  try {
    const aiRes = await fetch(`${AI_BACKEND_URL}/api/ai/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: textToProcess,
        count,
        difficulty,
        engine,
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

    if (!overrideText) {
      await supabase
        .from("org_documents")
        .update({ questions: result.questions })
        .eq("id", id);
    }

    return NextResponse.json({ questions: result.questions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Question generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
