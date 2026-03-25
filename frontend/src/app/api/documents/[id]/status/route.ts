/**
 * api/documents/[id]/status/route.ts — Processing Status
 *
 * GET /api/documents/:id/status
 * Returns the current processing status and queue info.
 *
 * @module api/documents/[id]/status
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
    .select("processing_status, processing_error, processed_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Get latest queue entry for progress info
  const { data: queue } = await supabase
    .from("processing_queue")
    .select("status, progress, step, started_at, completed_at")
    .eq("document_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json({
    processing_status: doc.processing_status,
    processing_error: doc.processing_error,
    processed_at: doc.processed_at,
    progress: queue?.progress ?? 0,
    step: queue?.step ?? null,
  });
}
