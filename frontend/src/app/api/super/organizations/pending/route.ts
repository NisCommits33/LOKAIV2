import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { verifySuperAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * GET /api/super/organizations/pending
 * Lists all organization applications for super admin review.
 * Requires super_admin role.
 */
export async function GET(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await verifySuperAdmin(supabase, user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const search = searchParams.get("search");

  // Use admin client (bypasses RLS) for data query
  const adminClient = createAdminClient();
  let query = adminClient
    .from("organization_applications")
    .select("*", { count: "exact" });

  if (search) {
    query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%,applicant_name.ilike.%${search}%`);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also fetch counts for each status to satisfy the UI dashboard summary
  const { data: countsData } = await adminClient
    .from("organization_applications")
    .select("status");

  const counts = {
    all: countsData?.length ?? 0,
    pending: countsData?.filter(a => a.status === "pending").length ?? 0,
    approved: countsData?.filter(a => a.status === "approved").length ?? 0,
    rejected: countsData?.filter(a => a.status === "rejected").length ?? 0
  };

  return NextResponse.json({ 
    data: data ?? [], 
    total: count ?? 0,
    counts 
  });
}
