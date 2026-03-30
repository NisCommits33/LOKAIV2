import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

const quizSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  category: z.string(),
  sub_category: z.string().optional(),
  thumbnail_url: z.string().url().nullable().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  questions: z.array(z.object({
    id: z.string(),
    question: z.string(),
    options: z.array(z.string()).min(2),
    correct_answer: z.number().int().min(0),
    explanation: z.string().optional(),
  })),
  time_limit_minutes: z.number().int().min(1).max(180).default(15),
  reward_xp: z.number().int().min(0).default(0),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
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
      
      const validation = quizSchema.safeParse(body);
      if (!validation.success) {
          return NextResponse.json({ error: "Invalid quiz data", details: validation.error.format() }, { status: 400 });
      }

      const { title, description, category, sub_category, thumbnail_url, difficulty, questions, time_limit_minutes, reward_xp } = validation.data;

      const admin = createAdminClient();
      const { data, error } = await admin
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

      await admin.from("audit_logs").insert({
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
