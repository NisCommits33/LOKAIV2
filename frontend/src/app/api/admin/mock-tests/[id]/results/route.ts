import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/admin/mock-tests/[id]/results
 * Returns all quiz attempts associated with a specific mock test.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id: mockTestId } = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify admin access to this organization
  const { data: profile } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "org_admin" && profile.role !== "super_admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch attempts with user details
  const { data, error } = await supabase
    .from("quiz_attempts")
    .select(`
      id,
      score,
      total_questions,
      time_spent,
      created_at,
      users (
        full_name,
        email,
        employee_id,
        avatar_url,
        departments ( name ),
        job_levels ( name )
      )
    `)
    .eq("mock_test_id", mockTestId)
    .order("score", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
