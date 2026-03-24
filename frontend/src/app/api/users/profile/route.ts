/**
 * api/users/profile/route.ts — User Profile API
 *
 * GET  /api/users/profile — Fetch the authenticated user's profile with
 *   joined organization, department, and job level data.
 *
 * PUT  /api/users/profile — Update the authenticated user's profile.
 *   Only whitelisted fields are accepted to prevent privilege escalation
 *   (role, employee_id, and verification fields are NOT updatable by the user).
 *
 * Both endpoints require authentication.
 *
 * @module api/users/profile
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch profile with related organization, department, and job level
  const { data, error } = await supabase
    .from("users")
    .select(
      `
      *,
      organization:organizations(id, name, code),
      department:departments(id, name, code),
      job_level:job_levels(id, name, level_order)
    `
    )
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

/** Update current user's profile (authenticated) */
export async function PUT(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Security: Only allow specific fields to prevent privilege escalation.
  // Fields like 'role', 'verification_status', and 'employee_id' are
  // controlled exclusively by admin actions.
  const allowedFields = [
    "full_name",
    "organization_id",
    "department_id",
    "job_level_id",
    "profile_completed",
  ];

  const updateData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      updateData[field] = body[field];
    }
  }

  const { data, error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
