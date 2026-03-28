import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Promote to org_admin
  const { error } = await supabase
    .from("users")
    .update({ role: "org_admin" })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Audit Log
  await supabase.from("audit_logs").insert({
     user_id: user.id,
     action: "USER_PROMOTED",
     target_type: "user",
     target_id: id,
     details: { previous_role: "employee", new_role: "org_admin" }
  });

  return NextResponse.json({ message: "User successfully promoted to Organization Admin." });
}
