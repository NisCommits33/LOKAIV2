/**
 * Super Admin Subscription Management
 *
 * GET  /api/super/subscriptions/[orgId] — Get org subscription details + usage
 * PUT  /api/super/subscriptions/[orgId] — Update subscription (change plan, extend, cancel)
 *
 * @module api/super/subscriptions/[orgId]
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { NextResponse, type NextRequest } from "next/server";
import { getOrgSubscription } from "@/lib/payments/subscription";

async function verifySuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "super_admin") return null;
  return user;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const user = await verifySuperAdmin();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { orgId } = await params;
  const admin = createAdminClient();

  // Verify org exists
  const { data: org } = await admin
    .from("organizations")
    .select("id, name")
    .eq("id", orgId)
    .single();

  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const subInfo = await getOrgSubscription(orgId);

  // Get usage history (last 6 months)
  const { data: usageHistory } = await admin
    .from("subscription_usage")
    .select("*")
    .eq("organization_id", orgId)
    .order("period_start", { ascending: false })
    .limit(6);

  // Count users
  const { count: userCount } = await admin
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("is_active", true);

  // Count actual documents (not stale subscription_usage counter)
  const { count: docCount } = await admin
    .from("org_documents")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId);

  return NextResponse.json({
    organization: org,
    subscription: subInfo?.subscription || null,
    usage: {
      current: { ...(subInfo?.usage || {}), documents_used: docCount || 0 },
      users_count: userCount || 0,
      history: usageHistory || [],
    },
    isExpired: subInfo?.isExpired || false,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const user = await verifySuperAdmin();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { orgId } = await params;
  const body = await request.json();
  const { action, planId, billingCycle, extensionDays, reason } = body;

  if (!action) {
    return NextResponse.json({ error: "action is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Verify org exists
  const { data: org } = await admin
    .from("organizations")
    .select("id, name")
    .eq("id", orgId)
    .single();

  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  switch (action) {
    case "change_plan": {
      if (!planId) {
        return NextResponse.json({ error: "planId required for change_plan" }, { status: 400 });
      }

      const { data: plan } = await admin
        .from("subscription_plans")
        .select("*")
        .eq("id", planId)
        .eq("is_active", true)
        .single();

      if (!plan) {
        return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
      }

      const now = new Date();
      const cycle = billingCycle || "monthly";
      const periodEnd = new Date(now);
      if (cycle === "yearly") {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      // Free plan gets far-future expiry
      if (plan.name === "free") {
        periodEnd.setFullYear(2099);
        periodEnd.setMonth(11);
        periodEnd.setDate(31);
      }

      // Expire current active subscription
      await admin
        .from("organization_subscriptions")
        .update({ status: "expired", updated_at: now.toISOString() })
        .eq("organization_id", orgId)
        .eq("status", "active");

      // Create new subscription
      const { data: newSub, error: subError } = await admin
        .from("organization_subscriptions")
        .insert({
          organization_id: orgId,
          plan_id: planId,
          status: "active",
          billing_cycle: cycle,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
        })
        .select("*, plan:subscription_plans(*)")
        .single();

      if (subError) {
        return NextResponse.json({ error: subError.message }, { status: 500 });
      }

      return NextResponse.json({
        message: `Plan changed to ${plan.display_name}`,
        subscription: newSub,
      });
    }

    case "extend": {
      if (!extensionDays || typeof extensionDays !== "number" || extensionDays < 1) {
        return NextResponse.json({ error: "extensionDays (positive number) required" }, { status: 400 });
      }

      // Find active subscription
      const { data: activeSub } = await admin
        .from("organization_subscriptions")
        .select("*")
        .eq("organization_id", orgId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!activeSub) {
        return NextResponse.json({ error: "No active subscription to extend" }, { status: 400 });
      }

      const currentEnd = new Date(activeSub.current_period_end);
      const newEnd = new Date(currentEnd);
      newEnd.setDate(newEnd.getDate() + extensionDays);

      await admin
        .from("organization_subscriptions")
        .update({
          current_period_end: newEnd.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", activeSub.id);

      return NextResponse.json({
        message: `Subscription extended by ${extensionDays} days (new end: ${newEnd.toLocaleDateString()})`,
        newEndDate: newEnd.toISOString(),
      });
    }

    case "cancel": {
      await admin
        .from("organization_subscriptions")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("organization_id", orgId)
        .eq("status", "active");

      // Auto-assign free plan
      const { data: freePlan } = await admin
        .from("subscription_plans")
        .select("id")
        .eq("name", "free")
        .single();

      if (freePlan) {
        await admin.from("organization_subscriptions").insert({
          organization_id: orgId,
          plan_id: freePlan.id,
          status: "active",
          billing_cycle: "monthly",
          current_period_start: new Date().toISOString(),
          current_period_end: "2099-12-31T23:59:59Z",
        });
      }

      return NextResponse.json({
        message: `Subscription cancelled. Organization reverted to Free plan.`,
        reason: reason || null,
      });
    }

    case "suspend": {
      await admin
        .from("organization_subscriptions")
        .update({
          status: "expired",
          updated_at: new Date().toISOString(),
        })
        .eq("organization_id", orgId)
        .eq("status", "active");

      return NextResponse.json({
        message: "Subscription suspended",
        reason: reason || null,
      });
    }

    default:
      return NextResponse.json(
        { error: "Invalid action. Use: change_plan, extend, cancel, suspend" },
        { status: 400 }
      );
  }
}
