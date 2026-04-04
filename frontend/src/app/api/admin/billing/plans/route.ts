/**
 * GET /api/admin/billing/plans — List all available subscription plans
 *
 * Requires authentication.
 *
 * @module api/admin/billing/plans
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getPlans } from "@/lib/payments/subscription";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const plans = await getPlans();
    return NextResponse.json({ plans });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch plans" },
      { status: 500 }
    );
  }
}
