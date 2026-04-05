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

/**
 * Handles POST requests for user verification.
 * 1. Checks if the user is authenticated.
 * 2. Validates the input data.
 * 3. Updates the user's profile with new verification details.
 */
export async function POST(request: Request) {
  // Initialize Supabase client
  const supabase = await createClient();

  // Retrieve current user session
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  // Return unauthorized error if no session found
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse request body
  const body = await request.json();
  const { organization_id, department_id, job_level_id, employee_id } = body;

  // Ensure organization_id is provided
  if (!organization_id) {
    return NextResponse.json(
      { error: "Organization is required" },
      { status: 400 }
    );
  }

  // Update user's verification status and organization details
  const { data, error } = await supabase
    .from("users")
    .update({
      organization_id,
      department_id: department_id || null,
      job_level_id: job_level_id || null,
      employee_id: employee_id || null,
      verification_status: "pending", // Reset status to pending for admin review
      rejection_reason: null, // Clear previous rejection details
      rejected_by: null,
      rejected_at: null,
    })
    .eq("id", user.id)
    .select()
    .single();

  // Handle database update errors
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return the updated user record
  return NextResponse.json(data);
}
