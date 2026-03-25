/**
 * api/documents/[id]/summary/route.ts — Document Summary
 *
 * GET /api/documents/:id/summary
 * Returns the AI-generated summary for the document.
 *
 * @module api/documents/[id]/summary
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
    .select("ai_summary, processing_status")
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

  return NextResponse.json({ summary: doc.ai_summary });
}
