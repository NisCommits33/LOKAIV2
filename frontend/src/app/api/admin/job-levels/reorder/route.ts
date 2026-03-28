import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
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

  const body = await request.json();
  const { updates } = body as { updates: { id: string, level_order: number }[] };

  if (!updates || !Array.isArray(updates)) {
    return NextResponse.json({ error: "Invalid updates payload" }, { status: 400 });
  }

  const promises = updates.map((update) => 
     supabase
      .from("job_levels")
      .update({ level_order: update.level_order })
      .eq("id", update.id)
      .eq("organization_id", profile.organization_id)
  );

  const results = await Promise.all(promises);
  
  const errors = results.filter(r => r.error).map(r => r.error?.message);
  if (errors.length > 0) {
     return NextResponse.json({ error: "Some updates failed", details: errors }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
