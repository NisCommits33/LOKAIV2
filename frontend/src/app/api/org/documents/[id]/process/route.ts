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
    .from("org_documents")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Allow reprocessing if failed
  if (doc.processing_status === "processing") {
    return NextResponse.json({ status: "processing", message: "Already processing" });
  }

  // Set status to processing
  await supabase
    .from("org_documents")
    .update({ processing_status: "processing", processing_error: null })
    .eq("id", id);

  // Download file from Supabase Storage
  const { data: fileData, error: downloadError } = await supabase.storage
    .from("documents")
    .download(doc.file_path);

  if (downloadError || !fileData) {
    await supabase
      .from("org_documents")
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
    // defaults
  }

  runFullPipelineInBackground(id, base64, language, engine_preference, question_count, difficulty);

  return NextResponse.json({ 
    status: "processing", 
    message: `Processing started using ${engine_preference} engine.` 
  });
}

async function runFullPipelineInBackground(
  docId: string,
  base64: string,
  language: string,
  engine_preference: string,
  question_count: number,
  difficulty: string
) {
  const { createClient: createBgClient } = await import("@/lib/supabase/server");
  const bgSupabase = await createBgClient();

  try {
    const aiResponse = await fetch(`${AI_BACKEND_URL}/api/ai/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doc_id: docId,
        doc_type: "org_documents", // <--- THIS is what tells FastAPI to update the right table
        file_base64: base64,
        language,
        engine_preference,
        question_count,
        difficulty
      }),
    });

    if (!aiResponse.ok) {
      const errorData = await aiResponse.json().catch(() => ({}));
      throw new Error((errorData as { detail?: string }).detail || `AI backend returned ${aiResponse.status}`);
    }

    console.log(`[Next.js API] Org Doc Pipeline started for ${docId}`);

  } catch (err) {
    const message = err instanceof Error ? err.message : "Pipeline start failed";
    console.error(`[Next.js API Error] ${message}`);
    await bgSupabase
      .from("org_documents")
      .update({ processing_status: "failed", processing_error: message })
      .eq("id", docId);
  }
}
