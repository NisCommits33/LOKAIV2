/**
 * api/gk/quizzes/custom/submit/route.ts — Personalized Practice Result Recorder
 *
 * POST /api/gk/quizzes/custom/submit
 * Records the result of a personalized/virtual GK drill.
 * Since the quiz doesn't exist in the DB, it validates based on the questions provided.
 *
 * @module api/gk/quizzes/custom/submit
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { answers, questions, time_spent, metadata } = await request.json();

  if (!questions || !Array.isArray(questions)) {
    return NextResponse.json({ error: "No question data provided" }, { status: 400 });
  }

  // 1. Calculate Score Server-Side for Integrity
  let score = 0;
  questions.forEach((q: any) => {
    const chosen = answers[q.id];
    if (chosen !== undefined && chosen === q.correct_answer) {
      score++;
    }
  });

  // 2. Insert into quiz_attempts (quiz_id is NULL for custom)
  const { data, error } = await supabase
    .from("quiz_attempts")
    .insert({
      user_id: user.id,
      quiz_id: null, // Virtual quiz
      source_type: "custom_drill",
      score,
      total_questions: questions.length,
      answers,
      time_spent: time_spent || 0,
      metadata: {
        ...metadata,
        quiz_title: `Personalized Practice: ${metadata?.category || "Mixed"}`
      }
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to record custom result:", error);
    return NextResponse.json({ error: error.message || "Failed to save custom quiz result" }, { status: 500 });
  }

  // Trigger cache revalidation for analytics
  revalidatePath("/api/gk/analytics/summary");

  return NextResponse.json({
    success: true,
    attempt_id: data.id,
    score,
    total: questions.length
  });
}
