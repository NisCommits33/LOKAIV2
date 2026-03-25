import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { verifySuperAdmin } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/super/organizations/[id]/reject
 * Rejects a pending organization application with a reason.
 * Requires super_admin role.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await verifySuperAdmin(supabase, user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { rejection_reason } = body;
  if (!rejection_reason || typeof rejection_reason !== "string") {
    return NextResponse.json(
      { error: "rejection_reason is required" },
      { status: 400 }
    );
  }

  // Use admin client (bypasses RLS) for data operations
  const adminClient = createAdminClient();

  // Verify the application exists and is pending
  const { data: application } = await adminClient
    .from("organization_applications")
    .select("status")
    .eq("id", id)
    .single();

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  if (application.status !== "pending") {
    return NextResponse.json(
      { error: `Application already ${application.status}` },
      { status: 400 }
    );
  }

  const { data, error } = await adminClient
    .from("organization_applications")
    .update({
      status: "rejected",
      rejection_reason: rejection_reason as string,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
