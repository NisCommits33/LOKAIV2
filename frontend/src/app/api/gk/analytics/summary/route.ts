/**
 * api/gk/analytics/summary/route.ts — User GK Progress Summary
 *
 * GET /api/gk/analytics/summary
 * Calculates live stats: Mastery Level, Current Streak, and Experience Rank.
 * No caching as per user requirement for real-time live data.
 *
 * @module api/gk/analytics/summary
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { startOfDay, subDays, isSameDay, parseISO } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Fetch all GK quiz attempts for the user, join with category info if available
  // Note: custom_drills might have category in metadata
  const { data: attempts, error } = await supabase
    .from("quiz_attempts")
    .select(`
      score, 
      total_questions, 
      created_at,
      source_type,
      metadata,
      gk_quizzes (category)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 2. Calculate Mastery Level (Global, Category-wise, and Sub-category wise)
  let totalCorrect = 0;
  let totalAttempted = 0;
  const categoryStats: Record<string, { correct: number; total: number }> = {};
  const subCategoryStats: Record<string, { correct: number; total: number }> = {};

  attempts.forEach((a: any) => {
    totalCorrect += a.score;
    totalAttempted += a.total_questions;

    // Determine category
    const category = a.gk_quizzes?.category || a.metadata?.category || "General Knowledge";
    if (!categoryStats[category]) categoryStats[category] = { correct: 0, total: 0 };
    categoryStats[category].correct += a.score;
    categoryStats[category].total += a.total_questions;

    // Determine sub-category (chapters)
    const subCat = a.gk_quizzes?.sub_category || "General";
    const subKey = `${category}::${subCat}`;
    if (!subCategoryStats[subKey]) subCategoryStats[subKey] = { correct: 0, total: 0 };
    subCategoryStats[subKey].correct += a.score;
    subCategoryStats[subKey].total += a.total_questions;
  });

  const masteryLevel = totalAttempted > 0 
    ? Math.round((totalCorrect / totalAttempted) * 100) 
    : 0;

  const categoriesMastery: Record<string, number> = {};
  Object.entries(categoryStats).forEach(([cat, s]) => {
    categoriesMastery[cat] = Math.round((s.correct / s.total) * 100);
  });

  const subCategoriesMastery: Record<string, number> = {};
  Object.entries(subCategoryStats).forEach(([key, s]) => {
    subCategoriesMastery[key] = Math.round((s.correct / s.total) * 100);
  });

  // 3. Calculate Current Streak (Consecutive Days)
  let currentStreak = 0;
  if (attempts.length > 0) {
    const uniqueDates = Array.from(
      new Set(attempts.map((a) => startOfDay(parseISO(a.created_at)).getTime()))
    ).sort((a, b) => b - a); // Descending

    const today = startOfDay(new Date()).getTime();
    const yesterday = subDays(new Date(), 1).getTime();

    // Start checking from the most recent attempt
    let checkDate = uniqueDates[0];
    
    // Only count as "current" if they've played today or yesterday
    if (checkDate === today || checkDate === yesterday) {
      currentStreak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const expectedDate = subDays(new Date(uniqueDates[i - 1]), 1).getTime();
        if (uniqueDates[i] === expectedDate) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
  }

  // 4. Calculate Approximate Rank (Percentile based on total solved)
  // For now, we use a simple heuristic: more questions = better rank.
  // In a real app, this would query a global leaderboard stats table.
  const solvedCount = totalCorrect;
  let rankLabel = "Beginner";
  let percentile = 99; // Top 99% (Everyone starts here)

  if (solvedCount > 500) { percentile = 1; rankLabel = "Grandmaster"; }
  else if (solvedCount > 250) { percentile = 5; rankLabel = "Expert"; }
  else if (solvedCount > 100) { percentile = 15; rankLabel = "Advanced"; }
  else if (solvedCount > 50) { percentile = 30; rankLabel = "Intermediate"; }
  else if (solvedCount > 10) { percentile = 60; rankLabel = "Apprentice"; }

  return NextResponse.json({
    mastery: masteryLevel,
    streak: currentStreak,
    categories: categoriesMastery,
    subCategories: subCategoriesMastery,
    rank: {
      label: rankLabel,
      percentile: percentile,
      totalSolved: solvedCount
    }
  });
}
