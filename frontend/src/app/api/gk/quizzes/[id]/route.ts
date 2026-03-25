/**
 * api/gk/quizzes/[id]/route.ts — Single GK Quiz API
 *
 * GET /api/gk/quizzes/:id
 * Returns a complete quiz including questions and options.
 * Correct answers are included (validated server-side on submit).
 *
 * @module api/gk/quizzes/[id]
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

  const { data, error } = await supabase
    .from("gk_quizzes")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
