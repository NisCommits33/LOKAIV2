import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  console.log(`[API] Hitting Org Document Status: ${id}`);

  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error("[API Error] Status fetch failed: Unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Fetch user profile to get organization context
  const { data: profile } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.organization_id) {
    console.error("[API Error] Status fetch failed: No organization profile found");
    return NextResponse.json({ error: "Forbidden: No organization association." }, { status: 403 });
  }

  // 3. Fetch document with explicit organization check
  const { data: doc, error: fetchError } = await supabase
    .from("org_documents")
    .select("processing_status, processing_error, processed_at, organization_id, ocr_progress, ocr_eta")
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .single();

  if (fetchError || !doc) {
    console.error(`[API Error] Status fetch failed: Document ${id} not found or RLS restricted.`);
    return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 });
  }

  console.log(`[API Success] Status for ${id}: ${doc.processing_status}`);

  // 4. Return status data
  return NextResponse.json({
    processing_status: doc.processing_status,
    processing_error: doc.processing_error,
    processed_at: doc.processed_at,
    progress: doc.ocr_progress ?? (doc.processing_status === "completed" ? 1 : 0),
    eta: doc.ocr_eta ?? null,
    step: doc.processing_status === "processing" ? "Analyzing Document..." : null,
  });
}
