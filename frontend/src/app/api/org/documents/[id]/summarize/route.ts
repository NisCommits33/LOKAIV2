import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { checkOrgLimit, incrementUsage } from "@/lib/payments/subscription";

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
    .select("role, organization_id, department_id, job_level_id")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.organization_id) {
    return NextResponse.json({ error: "Forbidden: Not part of an organization" }, { status: 403 });
  }

  const { data: doc, error } = await supabase
    .from("org_documents")
    .select("extracted_text, processing_status, is_published, target_department_id, target_job_level_id")
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .single();

  if (error || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Authorization Check
  if (profile.role !== "org_admin" && profile.role !== "super_admin") {
     // MUST be published
     if (!doc.is_published) {
        return NextResponse.json({ error: "Forbidden: This document is not yet available for study." }, { status: 403 });
     }

     // Targeting Enforcement
     if (doc.target_department_id && doc.target_department_id !== profile.department_id) {
        return NextResponse.json({ error: "Forbidden: This document is not assigned to your department." }, { status: 403 });
     }
     if (doc.target_job_level_id && doc.target_job_level_id !== profile.job_level_id) {
        return NextResponse.json({ error: "Forbidden: This document is not assigned to your job level." }, { status: 403 });
     }
  }

  if (!doc.extracted_text) {
    return NextResponse.json(
      { error: "Text has not been extracted yet. Please wait for OCR to finish." },
      { status: 400 }
    );
  }

  // Check AI request limit
  const aiLimit = await checkOrgLimit(profile.organization_id, "ai_requests");
  if (!aiLimit.allowed) {
    return NextResponse.json(
      { error: `AI request limit reached (${aiLimit.used}/${aiLimit.limit}). Please upgrade your plan.` },
      { status: 403 }
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

    // Increment AI usage counter after successful processing
    await incrementUsage(profile.organization_id, "ai_requests");

    // Save summary to document only if it's the full document text
    if (!overrideText) {
      await supabase
        .from("org_documents")
        .update({ ai_summary: result.summary })
        .eq("id", id);
    }

    return NextResponse.json({ summary: result.summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Summarization failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
