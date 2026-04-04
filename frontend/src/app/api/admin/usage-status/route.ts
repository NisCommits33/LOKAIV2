/**
 * GET /api/admin/usage-status — Quick usage status for warning banners
 *
 * Returns usage percentages for each tracked feature so the dashboard
 * can display warnings when approaching limits (≥80%) or over (100%).
 *
 * @module api/admin/usage-status
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
  getOrgSubscription,
  checkOrgLimit,
  type FeatureType,
} from "@/lib/payments/subscription";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "org_admin" || !profile.organization_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orgId = profile.organization_id;
  const subInfo = await getOrgSubscription(orgId);

  if (!subInfo) {
    return NextResponse.json({ error: "No subscription" }, { status: 404 });
  }

  const features: FeatureType[] = ["users", "documents", "ai_requests", "storage"];
  const warnings: Array<{
    feature: string;
    label: string;
    used: number;
    limit: number;
    percentage: number;
    level: "ok" | "warning" | "critical";
  }> = [];

  for (const feature of features) {
    const result = await checkOrgLimit(orgId, feature);

    // Skip unlimited features
    if (result.limit === -1) continue;

    const percentage = result.limit > 0 ? Math.round((result.used / result.limit) * 100) : 0;
    const level =
      percentage >= 100 ? "critical" : percentage >= 80 ? "warning" : "ok";

    const labels: Record<string, string> = {
      users: "Users",
      documents: "Documents",
      ai_requests: "AI Requests",
      storage: "Storage (MB)",
    };

    warnings.push({
      feature,
      label: labels[feature],
      used: result.used,
      limit: result.limit,
      percentage,
      level,
    });
  }

  const hasWarnings = warnings.some((w) => w.level !== "ok");

  return NextResponse.json({
    plan: subInfo.subscription.plan.display_name,
    isExpired: subInfo.isExpired,
    warnings,
    hasWarnings,
  });
}
