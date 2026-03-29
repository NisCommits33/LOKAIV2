import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Fetch user progress statistics
  const { data: progressList } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", user.id);

  if (!progressList || progressList.length === 0) {
    return NextResponse.json({
        readiness_score: 0,
        total_quizzes_taken: 0,
        weak_areas: [],
        strong_areas: [],
        progress_by_category: [],
        recommendations: []
    });
  }

  // Aggregate totals
  let totalCorrect = 0;
  let totalQuestions = 0;
  let totalAttempts = 0;

  const categoryAggregation: Record<string, { correct: number, total: number }> = {};

  progressList.forEach(p => {
      totalCorrect += p.correct_answers;
      totalQuestions += p.total_questions;
      totalAttempts += p.total_attempts;

      const cat = p.category_tag || "Uncategorized";
      if (!categoryAggregation[cat]) {
          categoryAggregation[cat] = { correct: 0, total: 0 };
      }
      categoryAggregation[cat].correct += p.correct_answers;
      categoryAggregation[cat].total += p.total_questions;
  });

  const readinessScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  // Calculate percentage for each categorized subject
  const progressByCategory = Object.entries(categoryAggregation).map(([category, stats]) => {
      return {
          category,
          accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
          total_questions: stats.total
      };
  });

  // Sort logically
  progressByCategory.sort((a, b) => b.total_questions - a.total_questions);

  // Identify strong vs weak areas
  const weakAreas = progressByCategory.filter(p => p.accuracy < 70 && p.total_questions >= 3);
  const strongAreas = progressByCategory.filter(p => p.accuracy >= 80 && p.total_questions >= 3);

  // 2. Fetch Document Recommendations (based on weak areas, or just general if none)
  let recommendations: any[] = [];
  
  if (weakAreas.length > 0) {
      const topWeak = weakAreas.sort((a, b) => a.accuracy - b.accuracy)[0];

      const { data: profile } = await supabase.from("users").select("department_id, organization_id").eq("id", user.id).single();
      
      if (profile && profile.organization_id) {
          let recQuery = supabase.from("org_documents")
             .select("id, title, description, policy_tag")
             .eq("organization_id", profile.organization_id)
             .eq("policy_tag", topWeak.category)
             .eq("processing_status", "completed")
             .limit(3);
             
          // Enforce department access
          if (profile.department_id) {
             recQuery = recQuery.or(`department_id.eq.${profile.department_id},department_id.is.null`);
          } else {
             recQuery = recQuery.is("department_id", null);
          }

          const { data: recData } = await recQuery;
          if (recData) {
              recommendations = recData;
          }
      }
  }

  // Fallback: If no recommendations found based on weak area, get latest 3 documents
  if (recommendations.length === 0) {
      const { data: profile } = await supabase.from("users").select("department_id, organization_id").eq("id", user.id).single();
      if (profile && profile.organization_id) {
          let recQuery = supabase.from("org_documents")
             .select("id, title, description, policy_tag")
             .eq("organization_id", profile.organization_id)
             .eq("processing_status", "completed")
             .order("created_at", { ascending: false })
             .limit(3);

          if (profile.department_id) {
             recQuery = recQuery.or(`department_id.eq.${profile.department_id},department_id.is.null`);
          } else {
             recQuery = recQuery.is("department_id", null);
          }

          const { data: recData } = await recQuery;
          if (recData) {
              recommendations = recData;
          }
      }
  }

  return NextResponse.json({
      readiness_score: readinessScore,
      total_quizzes_taken: totalAttempts,
      weak_areas: weakAreas,
      strong_areas: strongAreas,
      progress_by_category: progressByCategory,
      recommendations
  });
}
