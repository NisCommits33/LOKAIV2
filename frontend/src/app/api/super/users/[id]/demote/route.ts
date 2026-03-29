import { createAdminClient } from "@/lib/supabase/admin-client";
import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * demote/route.ts — Revoke Org Admin Status
 * 
 * Result: user.role becomes 'employee' (or 'public' if not in an org).
 * Most cases in cross-org management assume the user remains an employee.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  // 1. Verify Requesting User is Super Admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  // 2. Perform Role Update via Admin Client
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("users")
    .update({ role: "employee" })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "User demoted to Employee successfully" });
}
