import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("gk_quizzes")
    .select("*")
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
      const body = await request.json();
      const { title, description, category, sub_category, thumbnail_url, difficulty, questions, time_limit_minutes, reward_xp } = body;

      const { data, error } = await supabase
         .from("gk_quizzes")
         .insert({
             title,
             description,
             category,
             sub_category: sub_category || 'General',
             thumbnail_url: thumbnail_url || null,
             difficulty: (difficulty || 'medium').toLowerCase(),
             questions: questions || [],
             total_questions: Array.isArray(questions) ? questions.length : 0,
             time_limit_minutes: time_limit_minutes || 15,
             reward_xp: reward_xp || 0,
             is_active: true,
         })
         .select()
         .single();

      if (error) throw error;

      await supabase.from("audit_logs").insert({
          user_id: user.id,
          action: "CREATED_GLOBAL_QUIZ",
          target_type: "gk_quizzes",
          target_id: data.id
      });

      return NextResponse.json(data);
  } catch (err: unknown) {
      if (err instanceof Error) return NextResponse.json({ error: err.message }, { status: 500 });
      return NextResponse.json({ error: "Unknown error occurred" }, { status: 500 });
  }
}
