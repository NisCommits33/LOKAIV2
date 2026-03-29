/**
 * api/gk/quizzes/[id]/submit/route.ts — Quiz Submission API
 *
 * POST /api/gk/quizzes/:id/submit
 * Accepts user answers, scores them server-side, stores the attempt,
 * and returns the result with correct answers and explanations.
 *
 * @module api/gk/quizzes/[id]/submit
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

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
  const { answers, time_spent } = body as {
    answers: Record<string, number>;
    time_spent: number;
  };

  if (!answers || typeof answers !== "object") {
    return NextResponse.json({ error: "Answers are required" }, { status: 400 });
  }

  // Fetch quiz to validate answers server-side
  const { data: quiz, error: quizError } = await supabase
    .from("gk_quizzes")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (quizError || !quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  // Score the answers
  const questions = quiz.questions as Array<{
    id: string;
    correct_answer: number;
  }>;
  let score = 0;
  for (const q of questions) {
    if (answers[q.id] === q.correct_answer) {
      score++;
    }
  }

  // Store the attempt
  const { data: attempt, error: attemptError } = await supabase
    .from("quiz_attempts")
    .insert({
      user_id: user.id,
      quiz_id: id,
      source_type: "gk",
      score,
      total_questions: quiz.total_questions,
      answers,
      time_spent: time_spent || 0,
    })
    .select()
    .single();

  if (attemptError) {
    return NextResponse.json({ error: attemptError.message }, { status: 500 });
  }

  // Trigger cache revalidation for analytics
  revalidatePath("/api/gk/analytics/summary");

  return NextResponse.json({
    attempt_id: attempt.id,
    score,
    total_questions: quiz.total_questions,
    percentage: Math.round((score / quiz.total_questions) * 100),
    questions: quiz.questions,
    answers,
  });
}
