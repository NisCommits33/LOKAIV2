import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  // Check auth and role
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user profile to check department access
  const { data: profile } = await supabase
    .from("users")
    .select("department_id, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Fetch document
  const { data: doc, error: docError } = await supabase
    .from("org_documents")
    .select("id, title, department_id, questions")
    .eq("id", id)
    .single();

  if (docError || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Enforce access control: Employee can only see doc if it matches their department (or is org-wide null)
  if (profile.role === "employee" && doc.department_id && doc.department_id !== profile.department_id) {
    return NextResponse.json({ error: "Access Denied: Department restriction" }, { status: 403 });
  }

  const questions = doc.questions as any[];
  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: "No questions generated for this document yet" }, { status: 400 });
  }

  // Pick up to 10 random questions and strip correct logic
  const shuffled = [...questions].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 10);
  
  const safeQuestions = selected.map(q => ({
    id: q.id,
    question: q.question,
    options: q.options
  }));

  return NextResponse.json({
    document_id: doc.id,
    title: doc.title,
    total_questions: safeQuestions.length,
    questions: safeQuestions
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { answers, time_spent } = body as {
    answers: Record<string, number>;
    time_spent: number; // in seconds
  };

  if (!answers || typeof answers !== "object") {
    return NextResponse.json({ error: "Answers are required" }, { status: 400 });
  }

  // Fetch document to score answers and get tags
  const { data: doc, error: docError } = await supabase
    .from("org_documents")
    .select("id, policy_tag, chapter_tag, questions")
    .eq("id", id)
    .single();

  if (docError || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const allQuestions = doc.questions as Array<any>;
  if (!allQuestions) {
    return NextResponse.json({ error: "Quiz not configured properly" }, { status: 400 });
  }

  // Calculate score
  let score = 0;
  const questionsMap = new Map(allQuestions.map(q => [q.id, q]));
  const answeredQuestionIds = Object.keys(answers);
  const totalAttemptedQuestions = answeredQuestionIds.length;
  
  // Build detailed result array
  const detailedQuestions = [];

  for (const qId of answeredQuestionIds) {
    const qData = questionsMap.get(qId);
    if (!qData) continue;
    
    detailedQuestions.push({
        id: qData.id,
        question: qData.question,
        options: qData.options,
        correct_answer: qData.correct_answer,
        explanation: qData.explanation
    });

    if (answers[qId] === qData.correct_answer) {
      score++;
    }
  }

  // 1. Store the attempt
  const { data: attempt, error: attemptError } = await supabase
    .from("quiz_attempts")
    .insert({
      user_id: user.id,
      quiz_id: null, // No gk_quiz associated
      source_type: "org_document",
      source_id: doc.id,
      score,
      total_questions: totalAttemptedQuestions,
      answers,
      time_spent: time_spent || 0,
    })
    .select()
    .single();

  if (attemptError) {
    return NextResponse.json({ error: attemptError.message }, { status: 500 });
  }

  // 2. Update user_progress
  // We use policy_tag as category_tag, and chapter_tag as sub_category_tag
  const categoryTag = doc.policy_tag || 'uncategorized';
  const subCategoryTag = doc.chapter_tag || 'uncategorized';

  // Fetch existing progress
  const { data: progressRow } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("category_tag", categoryTag)
    .eq("sub_category_tag", subCategoryTag)
    .single();

  if (progressRow) {
    // Update existing
    const newTotalAttempts = progressRow.total_attempts + 1;
    const newCorrect = progressRow.correct_answers + score;
    const newTotalQs = progressRow.total_questions + totalAttemptedQuestions;
    const newAccuracy = (newCorrect / newTotalQs) * 100;

    await supabase
      .from("user_progress")
      .update({
        total_attempts: newTotalAttempts,
        correct_answers: newCorrect,
        total_questions: newTotalQs,
        accuracy_pct: newAccuracy,
        last_attempted_at: new Date().toISOString()
      })
      .eq("id", progressRow.id);
  } else {
    // Insert new
    const accuracy = totalAttemptedQuestions > 0 ? (score / totalAttemptedQuestions) * 100 : 0;
    
    await supabase
      .from("user_progress")
      .insert({
        user_id: user.id,
        category_tag: categoryTag,
        sub_category_tag: subCategoryTag,
        total_attempts: 1,
        correct_answers: score,
        total_questions: totalAttemptedQuestions,
        accuracy_pct: accuracy,
        last_attempted_at: new Date().toISOString()
      });
  }

  return NextResponse.json({
    attempt_id: attempt.id,
    score,
    total_questions: totalAttemptedQuestions,
    percentage: totalAttemptedQuestions > 0 ? Math.round((score / totalAttemptedQuestions) * 100) : 0,
    questions: detailedQuestions, // returning the detailed questions with correct answers
    answers,
  });
}
