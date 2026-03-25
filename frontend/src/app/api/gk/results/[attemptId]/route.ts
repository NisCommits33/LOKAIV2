/**
 * api/gk/results/[attemptId]/route.ts — Quiz Result Detail API
 *
 * GET /api/gk/results/:attemptId
 * Returns full attempt details including questions, user answers,
 * correct answers, and explanations for a review page.
 *
 * @module api/gk/results/[attemptId]
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  const supabase = await createClient();
  const { attemptId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch attempt (user can only see own attempts via RLS)
  const { data: attempt, error: attemptError } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .single();

  if (attemptError || !attempt) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  // Fetch quiz questions for review
  const { data: quiz, error: quizError } = await supabase
    .from("gk_quizzes")
    .select("title, category, difficulty, questions, total_questions, time_limit_minutes")
    .eq("id", attempt.quiz_id)
    .single();

  if (quizError || !quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  return NextResponse.json({
    attempt,
    quiz,
  });
}
