/**
 * api/users/mock-tests/[id]/submit/route.ts — Mock Test Submission API
 *
 * POST /api/users/mock-tests/:id/submit
 * Handles official scoring for mock tests (standardized assessments).
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

  // 1. Fetch the mock test to get snapshotted questions and timing
  const { data: test, error: testError } = await supabase
    .from("mock_tests")
    .select("*")
    .eq("id", id)
    .single();

  if (testError || !test) {
    return NextResponse.json({ error: "Mock test not found" }, { status: 404 });
  }

  // 2. Check if already attempted (if restriction exists)
  // For now we allow one attempt per mock test via unique constraint or application logic
  const { count } = await supabase
    .from("quiz_attempts")
    .select("*", { count: 'exact', head: true })
    .eq("user_id", user.id)
    .eq("mock_test_id", id);

  if (count && count > 0) {
    return NextResponse.json({ error: "You have already completed this assessment." }, { status: 400 });
  }

  // 3. Score the answers
  // Mock tests always have questions snapshotted in the 'questions' column
  const questions = test.questions as Array<{
    id: string;
    correct_answer: number;
  }>;
  
  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: "Test configuration error: no questions found." }, { status: 500 });
  }

  let score = 0;
  for (const q of questions) {
    if (answers[q.id] === q.correct_answer) {
      score++;
    }
  }

  // 4. Store the attempt
  const { data: attempt, error: attemptError } = await supabase
    .from("quiz_attempts")
    .insert({
      user_id: user.id,
      quiz_id: test.quiz_id, // Might be null if it's document-based
      mock_test_id: id,
      source_type: test.quiz_id ? "gk" : "document",
      score,
      total_questions: questions.length,
      answers,
      time_spent: time_spent || 0,
    })
    .select()
    .single();

  if (attemptError) {
    console.error("Mock test attempt error:", attemptError);
    return NextResponse.json({ error: "Failed to record results." }, { status: 500 });
  }

  return NextResponse.json({
    attempt_id: attempt.id,
    score,
    total_questions: questions.length,
    percentage: Math.round((score / questions.length) * 100),
  });
}
