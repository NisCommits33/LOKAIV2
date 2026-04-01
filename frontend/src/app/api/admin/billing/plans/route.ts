/**
 * GET /api/admin/billing/plans — List all available subscription plans
 *
 * @module api/admin/billing/plans
 */

import { NextResponse } from "next/server";
import { getPlans } from "@/lib/payments/subscription";

export async function GET() {
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
