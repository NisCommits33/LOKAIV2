/**
 * subscription.ts — Subscription enforcement utilities
 *
 * Server-side helpers to check org limits, get current plan, and track usage.
 *
 * @module lib/payments/subscription
 */

import { createAdminClient } from "@/lib/supabase/admin-client";
import type {
  SubscriptionPlan,
  OrganizationSubscription,
  SubscriptionUsage,
} from "@/types/database";

export type FeatureType = "users" | "documents" | "ai_requests" | "storage";

export interface OrgSubscriptionInfo {
  subscription: OrganizationSubscription & { plan: SubscriptionPlan };
  usage: SubscriptionUsage | null;
  isExpired: boolean;
}

/**
 * Get the current active subscription for an organization
 */
export async function getOrgSubscription(
  orgId: string
): Promise<OrgSubscriptionInfo | null> {
  const admin = createAdminClient();

  const { data: sub } = await admin
    .from("organization_subscriptions")
    .select("*, plan:subscription_plans(*)")
    .eq("organization_id", orgId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!sub) return null;

  // Get current month usage
  // Use UTC to match DB's date_trunc('month', now())::date
  const now = new Date();
  const periodStartStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;

  const { data: usage } = await admin
    .from("subscription_usage")
    .select("*")
    .eq("organization_id", orgId)
    .eq("period_start", periodStartStr)
    .single();

  const isExpired = new Date(sub.current_period_end) < new Date();

  return {
    subscription: sub as OrganizationSubscription & { plan: SubscriptionPlan },
    usage: usage as SubscriptionUsage | null,
    isExpired,
  };
}

/**
 * Check if an org has remaining quota for a specific feature.
 * If the subscription is expired, falls back to free plan limits.
 * Returns { allowed: true, remaining } or { allowed: false, limit, used }.
 */
export async function checkOrgLimit(
  orgId: string,
  feature: FeatureType
): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
  used: number;
}> {
  const info = await getOrgSubscription(orgId);
  if (!info) {
    return { allowed: false, remaining: 0, limit: 0, used: 0 };
  }

  // If subscription is expired, enforce free plan limits instead
  let plan = info.subscription.plan;
  if (info.isExpired) {
    const admin = createAdminClient();
    const { data: freePlan } = await admin
      .from("subscription_plans")
      .select("*")
      .eq("name", "free")
      .single();
    if (freePlan) plan = freePlan as SubscriptionPlan;
  }

  let limit: number;
  let used: number;

  switch (feature) {
    case "users": {
      limit = plan.max_users;
      const admin = createAdminClient();
      const { count } = await admin
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .eq("is_active", true);
      used = count || 0;
      break;
    }
    case "documents": {
      limit = plan.max_documents_per_month;
      // Count actual documents in DB (not cumulative counter) so deletions are reflected
      const adminDocs = createAdminClient();
      const { count: docCount } = await adminDocs
        .from("org_documents")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", orgId);
      used = docCount || 0;
      break;
    }
    case "ai_requests":
      limit = plan.max_ai_requests_per_month;
      used = info.usage?.ai_requests_used || 0;
      break;
    case "storage":
      limit = plan.max_storage_mb;
      used = info.usage?.storage_used_mb || 0;
      break;
  }

  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, remaining: -1, limit: -1, used };
  }

  const remaining = Math.max(limit - used, 0);
  return { allowed: remaining > 0, remaining, limit, used };
}

/**
 * Increment usage counter for an org (call after successful feature use).
 * Uses the atomic DB function to avoid race conditions under concurrency.
 */
export async function incrementUsage(
  orgId: string,
  feature: Exclude<FeatureType, "users">,
  amount: number = 1
): Promise<void> {
  const admin = createAdminClient();
  await admin.rpc("increment_usage", {
    p_org_id: orgId,
    p_feature: feature,
    p_amount: amount,
  });
}

export type FeatureFlag = "has_advanced_analytics" | "has_export";

/**
 * Check if an org's current plan includes a specific feature flag.
 * Falls back to free plan if subscription is expired.
 */
export async function checkFeatureFlag(
  orgId: string,
  flag: FeatureFlag
): Promise<boolean> {
  const info = await getOrgSubscription(orgId);
  if (!info) return false;

  let plan = info.subscription.plan;
  if (info.isExpired) {
    const admin = createAdminClient();
    const { data: freePlan } = await admin
      .from("subscription_plans")
      .select("*")
      .eq("name", "free")
      .single();
    if (freePlan) plan = freePlan as SubscriptionPlan;
  }

  return plan[flag] === true;
}

/**
 * Get all available plans
 */
export async function getPlans(): Promise<SubscriptionPlan[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("subscription_plans")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (data || []) as SubscriptionPlan[];
}
