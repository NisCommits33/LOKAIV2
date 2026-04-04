/**
 * GET /api/plans — Public endpoint listing all active subscription plans
 *
 * No authentication required. Used by the landing page pricing section.
 *
 * @module api/plans
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
