/**
 * api/users/verify/route.ts — Employee Verification Request API
 *
 * POST /api/users/verify
 * Allows a user to (re)submit an employee verification request.
 * Sets verification_status back to 'pending' and updates org/dept/job level.
 * Used when a rejected user reapplies from /profile-setup.
 *
 * Requires authentication.
 *
 * @module api/users/verify
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { organization_id, department_id, job_level_id, employee_id } = body;

  if (!organization_id) {
    return NextResponse.json(
      { error: "Organization is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("users")
    .update({
      organization_id,
      department_id: department_id || null,
      job_level_id: job_level_id || null,
      employee_id: employee_id || null,
      verification_status: "pending",
      rejection_reason: null,
      rejected_by: null,
      rejected_at: null,
    })
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
