import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "org_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orgId = profile.organization_id;

  try {
    // 1. User Stats
    const { count: totalUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId);

    const { count: activeUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("is_active", true);

    const { count: verifiedUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("verification_status", "verified");

    // 2. Org Structure Stats
    const { count: totalDepartments } = await supabase
      .from("departments")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("is_active", true);

    const { count: totalJobLevels } = await supabase
      .from("job_levels")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("is_active", true);

    // 3. Document basic agg
    let totalDocuments = 0;
    const { data: orgUsers } = await supabase.from("users").select("id").eq("organization_id", orgId);
    if (orgUsers && orgUsers.length > 0) {
      const userIds = orgUsers.map(u => u.id);
      
      const { count: docsCount } = await supabase
        .from("personal_documents")
        .select("*", { count: "exact", head: true })
        .in("user_id", userIds);
        
      totalDocuments = docsCount || 0;
    }

    return NextResponse.json({
      users: {
        total: totalUsers || 0,
        active: activeUsers || 0,
        verified: verifiedUsers || 0,
      },
      organization: {
        departments: totalDepartments || 0,
        jobLevels: totalJobLevels || 0,
      },
      content: {
        documents: totalDocuments || 0,
      }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
