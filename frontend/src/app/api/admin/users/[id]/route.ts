import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
    return NextResponse.json({ error: "Forbidden: Org Admin required" }, { status: 403 });
  }

  const body = await request.json();
  const { department_id, job_level_id, employee_id } = body;
  
  const updateData: any = {};
  if (department_id !== undefined) updateData.department_id = department_id || null;
  if (job_level_id !== undefined) updateData.job_level_id = job_level_id || null;
  if (employee_id !== undefined) updateData.employee_id = employee_id;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No valid fields provided for update" }, { status: 400 });
  }

  // Security: only allow updating users within the admin's organization
  const { data, error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
