/**
 * api/gk/quizzes/custom/route.ts — Custom Practice Generator
 *
 * GET /api/gk/quizzes/custom
 * Dynamically generates a quiz based on user-defined:
 * - count (Number of questions)
 * - difficulty (Easy, Medium, Hard)
 * - category (Optional: History, Constitution, etc.)
 * - timer (Optional: Duration in minutes)
 *
 * Pulls from the existing pool of 1000+ questions.
 *
 * @module api/gk/quizzes/custom
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { QuizQuestion } from "@/types/database";

export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const count = Math.min(parseInt(searchParams.get("count") || "10", 10), 50);
  const difficulty = searchParams.get("difficulty");
  const category = searchParams.get("category");
  const timerInput = searchParams.get("timer");
  const timeLimit = timerInput && timerInput !== "0" ? parseInt(timerInput, 10) : 0;

  // 1. Fetch available quizzes in the pool
  let query = supabase.from("gk_quizzes").select("questions, title, category").eq("is_active", true);

  if (difficulty && difficulty !== "All") {
    query = query.eq("difficulty", difficulty);
  }
  if (category && category !== "All") {
    query = query.eq("category", category);
  }

  const { data: quizPool, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 2. Flatten all questions from the pool into a single array
  const allQuestions: QuizQuestion[] = (quizPool || []).flatMap((q: any) => q.questions || []);

  if (allQuestions.length === 0) {
    return NextResponse.json({ error: "No matching questions found in the pool" }, { status: 404 });
  }

  // 3. Shuffle (Fisher-Yates) and slice to the requested count
  const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
  const selectedQuestions = shuffled.slice(0, count).map((q, idx) => ({
    ...q,
    id: `custom-q-${idx}-${Date.now()}` // Ensure unique keys for the UI
  }));

  // 4. Return as a dynamic "Personalized Practice" quiz object
  return NextResponse.json({
    id: "custom-" + Date.now(),
    title: `Personalized Practice: ${category || "General Knowledge"}`,
    description: `A tailored GK drill with ${selectedQuestions.length} questions.`,
    category: category || "Mixed",
    difficulty: difficulty || "Mixed",
    total_questions: selectedQuestions.length,
    time_limit_minutes: timeLimit > 0 ? timeLimit : 0, // 0 handles timer visibility in UI
    questions: selectedQuestions,
    is_custom: true
  });
}
