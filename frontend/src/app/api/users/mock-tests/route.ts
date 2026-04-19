import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/**
 * GET /api/users/mock-tests
 * Returns active mock tests for the authenticated user's organization.
 */
export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get user's org
  const { data: profile } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    return NextResponse.json({ error: "User has no organization" }, { status: 400 });
  }

  // Fetch tests that are published for the org
  const { data, error } = await supabase
    .from("mock_tests")
    .select(`
      *,
      gk_quizzes ( title, category, difficulty ),
      quiz_attempts ( 
        id, 
        score, 
        total_questions, 
        created_at 
      )
    `)
    .eq("organization_id", profile.organization_id)
    .eq("is_published", true)
    .order("start_time", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  return NextResponse.json(data);
}
