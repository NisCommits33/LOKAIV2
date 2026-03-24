/**
 * api/users/verification-status/route.ts — Verification Status API
 *
 * GET /api/users/verification-status
 * Returns the authenticated user's verification status, rejection reason,
 * and timestamps. Used by the pending-approval page to check status.
 *
 * Requires authentication.
 *
 * @module api/users/verification-status
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

  const { data, error } = await supabase
    .from("users")
    .select("verification_status, rejection_reason, verified_at, rejected_at")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
