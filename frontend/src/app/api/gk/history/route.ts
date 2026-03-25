/**
 * api/gk/history/route.ts — Quiz History API
 *
 * GET /api/gk/history
 * Returns the authenticated user's past quiz attempts with quiz metadata.
 * Supports pagination via limit/offset query params.
 *
 * @module api/gk/history
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
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const { data, error, count } = await supabase
    .from("quiz_attempts")
    .select("*, gk_quizzes(title, category, difficulty)", { count: "exact" })
    .eq("user_id", user.id)
    .eq("source_type", "gk")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ attempts: data, total: count });
}
