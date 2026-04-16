import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/admin/mock-tests
 * List all mock tests for the authenticated admin's organization.
 */
export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get admin profile
  const { data: profile } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "org_admin" && profile.role !== "super_admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("mock_tests")
    .select(`
      *,
      gk_quizzes ( title, category, difficulty )
    `)
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/**
 * POST /api/admin/mock-tests
 * Create/Schedule a new mock test.
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id || (profile.role !== "org_admin" && profile.role !== "super_admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { 
      title, 
      description, 
      quiz_id, 
      document_id, 
      questions, 
      time_limit, 
      question_limit,
      start_time,
      end_time,
      is_published
    } = body;

    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const { data, error } = await supabase
      .from("mock_tests")
      .insert({
        organization_id: profile.organization_id,
        quiz_id: quiz_id || null,
        document_id: document_id || null,
        title,
        description,
        questions: questions || null,
        time_limit: time_limit || 15,
        question_limit: question_limit || null,
        start_time: start_time || new Date().toISOString(),
        end_time: end_time || null,
        is_published: !!is_published
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
