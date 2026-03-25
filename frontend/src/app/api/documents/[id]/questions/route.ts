/**
 * api/documents/[id]/questions/route.ts — Document Questions
 *
 * GET  /api/documents/:id/questions — Return AI-generated questions
 * POST /api/documents/:id/questions — Save edited questions back
 *
 * @module api/documents/[id]/questions
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
    .select("questions, processing_status")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (doc.processing_status !== "completed") {
    return NextResponse.json(
      { error: "Document has not been processed yet" },
      { status: 400 }
    );
  }

  return NextResponse.json({ questions: doc.questions });
}

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

  const body = await request.json();
  const { questions } = body as { questions: unknown[] };

  if (!Array.isArray(questions)) {
    return NextResponse.json(
      { error: "questions must be an array" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("personal_documents")
    .update({ questions })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
