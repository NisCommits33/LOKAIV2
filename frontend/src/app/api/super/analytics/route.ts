import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  const adminClient = createAdminClient();

  // Fetch counts bypassing RLS perfectly for super admin metrics
  const [{ count: orgsCount }, { count: usersCount }, { count: docsCount }, { count: quizzesCount }, { data: growth }] = await Promise.all([
     adminClient.from("organizations").select("*", { count: "exact", head: true }),
     adminClient.from("users").select("*", { count: "exact", head: true }),
     adminClient.from("org_documents").select("*", { count: "exact", head: true }),
     adminClient.from("gk_quizzes").select("*", { count: "exact", head: true }),
     adminClient.from("organizations").select("created_at").order("created_at", { ascending: true }) // for a basic growth chart
  ]);
  
  // Basic grouping by month for the chart
  const orgGrowth: { name: string; total: number }[] = [];
  if (growth) {
     const monthlyCounts: Record<string, number> = {};
     growth.forEach(o => {
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
          totalOrganizations: orgsCount || 0,
          totalUsers: usersCount || 0,
          totalDocuments: docsCount || 0,
          totalQuizzes: quizzesCount || 0
      },
      growthData: orgGrowth
  });
}
