/**
 * api/gk/quizzes/route.ts — GK Quiz Listing API
 *
 * GET /api/gk/quizzes
 * Returns active GK quizzes (without full question data for listing view).
 * Supports optional category and difficulty query filters.
 *
 * @module api/gk/quizzes
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const difficulty = searchParams.get("difficulty");
  const search = searchParams.get("search");

  let query = supabase
    .from("gk_quizzes")
    .select("id, title, description, category, difficulty, total_questions, time_limit_minutes, is_active, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }
  if (difficulty) {
    query = query.eq("difficulty", difficulty);
  }
  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
