import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile, error: profileError } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (profileError) {
      console.error("[super/analytics] Profile fetch error:", profileError);
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
    }
    if (!profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
    }

    const adminClient = createAdminClient();

    // Fetch counts bypassing RLS perfectly for super admin metrics
    const [orgsResult, usersResult, docsResult, quizzesResult, growthResult] = await Promise.all([
       adminClient.from("organizations").select("*", { count: "exact", head: true }),
       adminClient.from("users").select("*", { count: "exact", head: true }),
       adminClient.from("org_documents").select("*", { count: "exact", head: true }),
       adminClient.from("gk_quizzes").select("*", { count: "exact", head: true }),
       adminClient.from("organizations").select("created_at").order("created_at", { ascending: true })
    ]);

    // Log any query errors
    for (const [name, r] of Object.entries({ orgs: orgsResult, users: usersResult, docs: docsResult, quizzes: quizzesResult, growth: growthResult })) {
      if (r.error) console.error(`[super/analytics] ${name} query error:`, r.error);
    }
    
    // Basic grouping by month for the chart
    const orgGrowth: { name: string; total: number }[] = [];
    if (growthResult.data) {
       const monthlyCounts: Record<string, number> = {};
       growthResult.data.forEach((o: { created_at: string }) => {
           const month = new Date(o.created_at).toLocaleString('default', { month: 'short' });
           monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
       });
       
       let cumulative = 0;
       for (const [month, count] of Object.entries(monthlyCounts)) {
           cumulative += count;
           orgGrowth.push({ name: month, total: cumulative });
       }
    }

    return NextResponse.json({
        metrics: {
            totalOrganizations: orgsResult.count || 0,
            totalUsers: usersResult.count || 0,
            totalDocuments: docsResult.count || 0,
            totalQuizzes: quizzesResult.count || 0
        },
        growthData: orgGrowth
    });
  } catch (err) {
    console.error("[super/analytics] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
