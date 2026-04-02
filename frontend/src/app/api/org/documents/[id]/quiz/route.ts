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

  // Fetch document with publishing metadata
  const { data: doc, error: docError } = await supabase
    .from("org_documents")
    .select("id, title, is_published, target_department_id, target_job_level_id, questions")
    .eq("id", id)
    .single();

  if (docError || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Authorization Check for Employees
  if (profile.role !== "org_admin" && profile.role !== "super_admin") {
    // 1. MUST be published
    if (!doc.is_published) {
       return NextResponse.json({ error: "Access Denied: Quiz is not published" }, { status: 403 });
    }

    // 2. Targeting Enforcement - Department
    if (doc.target_department_id && doc.target_department_id !== profile.department_id) {
       return NextResponse.json({ error: "Access Denied: Not assigned to your department" }, { status: 403 });
    }

    // 3. Targeting Enforcement - Job Level
    const { data: userDetails } = await supabase.from("users").select("job_level_id").eq("id", user.id).single();
    if (doc.target_job_level_id && doc.target_job_level_id !== userDetails?.job_level_id) {
       return NextResponse.json({ error: "Access Denied: Not assigned to your job level" }, { status: 403 });
    }
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

  // Fetch profile to check targeting
  const { data: profile } = await supabase
    .from("users")
    .select("role, department_id, job_level_id")
    .eq("id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 403 });

  // Fetch document to score answers and verify access
  const { data: doc, error: docError } = await supabase
    .from("org_documents")
    .select("id, policy_tag, chapter_tag, questions, is_published, target_department_id, target_job_level_id")
    .eq("id", id)
    .single();

  if (docError || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Final security check for POST
  // Admin/Super Admin can take the quiz but it won't impact their personal analytics (handled by DB trigger)
  if (profile.role !== "org_admin" && profile.role !== "super_admin") {
      if (!doc.is_published) return NextResponse.json({ error: "Forbidden: Not published" }, { status: 403 });
      if (doc.target_department_id && doc.target_department_id !== profile.department_id) return NextResponse.json({ error: "Forbidden: Targeted dept mismatch" }, { status: 403 });
      if (doc.target_job_level_id && doc.target_job_level_id !== profile.job_level_id) return NextResponse.json({ error: "Forbidden: Targeted level mismatch" }, { status: 403 });
  }

  const allQuestions = doc.questions as Array<any>;
  if (!allQuestions) {
    return NextResponse.json({ error: "Quiz not configured properly" }, { status: 400 });
  }

  // Calculate score
  let score = 0;
  const questionsMap = new Map(allQuestions.map(q => [q.id, q]));
  const answeredQuestionIds = Object.keys(answers || {});
  
  // Build detailed result array
  const detailedQuestions = [];

  for (const qId of (allQuestions as any[]).map(q => q.id)) {
    const qData = questionsMap.get(qId);
    if (!qData) continue;
    
    const userAnswer = answers?.[qId];
    const isCorrect = userAnswer === qData.correct_answer;
    if (isCorrect) score++;

    detailedQuestions.push({
        id: qData.id,
        question: qData.question,
        options: qData.options,
        user_answer: userAnswer,
        correct_answer: qData.correct_answer,
        is_correct: isCorrect,
        explanation: qData.explanation
    });
  }

  const totalQuestions = allQuestions.length;
  const accuracy = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;

  // Save Attempt
  const { data: attempt, error: attemptError } = await supabase
    .from("quiz_attempts")
    .insert({
      user_id: user.id,
      source_id: id,
      source_type: "org_document",
      score: score,
      total_questions: totalQuestions,
      time_spent: time_spent || 0,
      metadata: { 
        accuracy,
        detailed_results: detailedQuestions
      }
    })
    .select()
    .single();

  if (attemptError) {
    console.error("Quiz save error:", attemptError);
    return NextResponse.json({ error: "Failed to save quiz result" }, { status: 500 });
  }

  return NextResponse.json({
    score,
    total: totalQuestions,
    accuracy,
    results: detailedQuestions
  });
}
