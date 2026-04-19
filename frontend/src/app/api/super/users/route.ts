import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const search = searchParams.get("search");

  let query = supabase
    .from("users")
    .select(`
       id, email, full_name, avatar_url, role, verification_status, 
       is_active, profile_completed, created_at, updated_at,
       organization:organizations(name),
       department:departments(name),
       job_level:job_levels(name)
    `, { count: "exact" });

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("[API Error] User listing failed:", error.message);
    return NextResponse.json({ error: "Failed to fetch users due to an internal error." }, { status: 500 });
  }

  return NextResponse.json({ users: data, total: count ?? 0 });
}
