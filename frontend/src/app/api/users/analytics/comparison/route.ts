import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  // Call the function we created in the migration
  const { data: rankData, error } = await supabase.rpc("get_user_percentile", {
    target_user_id: user.id,
    target_category: category === "all" ? null : category
  });

  if (error) {
    console.error("Percentile calculation error:", error);
    return NextResponse.json({ error: "Failed to calculate ranking" }, { status: 500 });
  }

  const result = rankData?.[0] || { user_rank: 1, total_peers: 1, percentile: 100 };

  // Fetch averages for organization
  const { data: profile } = await supabase.from("users").select("organization_id").eq("id", user.id).single();
  
  let orgAvg = 0;
  if (profile?.organization_id) {
    const { data: orgData } = await supabase
      .from("user_progress")
      .select("accuracy_pct")
      .eq("organization_id", profile.organization_id);
    
    if (orgData && orgData.length > 0) {
      orgAvg = orgData.reduce((acc, curr) => acc + curr.accuracy_pct, 0) / orgData.length;
    }
  }

  return NextResponse.json({
    rank: result.user_rank,
    total: result.total_peers,
    percentile: Math.round(result.percentile * 10) / 10,
    org_average: Math.round(orgAvg * 10) / 10,
    message: result.percentile >= 90 
        ? "Legendary! You're in the elite 10% of your organization."
        : result.percentile >= 75
        ? "Excellent! You're performing better than 75% of your colleagues."
        : result.percentile >= 50
        ? "Good work! You're above the organizational median."
        : "Keep practicing to climb the organizational rankings."
  });
}
