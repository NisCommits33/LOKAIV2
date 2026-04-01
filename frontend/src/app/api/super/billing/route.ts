/**
 * GET /api/super/billing — All organizations' subscriptions & revenue overview
 *
 * Super admin only. Returns subscription data across all organizations
 * plus revenue stats and recent transactions.
 *
 * @module api/super/billing
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { NextResponse } from "next/server";

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
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "super_admin") {
    return NextResponse.json(
      { error: "Forbidden: Super Admin only" },
      { status: 403 }
    );
  }

  const admin = createAdminClient();

  // All subscriptions with org and plan details
  const { data: subscriptions } = await admin
    .from("organization_subscriptions")
    .select(
      "*, organization:organizations(id, name), plan:subscription_plans(*)"
    )
    .order("created_at", { ascending: false });

  // All transactions (last 50)
  const { data: transactions } = await admin
    .from("payment_transactions")
    .select(
      "*, organization:organizations(id, name), plan:subscription_plans(name, display_name)"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  // All plans
  const { data: plans } = await admin
    .from("subscription_plans")
    .select("*")
    .order("sort_order", { ascending: true });

  // Revenue stats
  const { data: completedTxns } = await admin
    .from("payment_transactions")
    .select("total_amount, created_at")
    .eq("status", "completed");

  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const totalRevenue = (completedTxns || []).reduce(
    (sum, t) => sum + (t.total_amount || 0),
    0
  );
  const monthlyRevenue = (completedTxns || [])
    .filter((t) => new Date(t.created_at) >= thisMonth)
    .reduce((sum, t) => sum + (t.total_amount || 0), 0);

  // Plan distribution (active subs only)
  const activeSubs = (subscriptions || []).filter(
    (s) => s.status === "active"
  );
  const planDistribution = (plans || []).map((p) => ({
    name: p.display_name,
    count: activeSubs.filter((s) => s.plan_id === p.id).length,
  }));

  return NextResponse.json({
    subscriptions: subscriptions || [],
    transactions: transactions || [],
    plans: plans || [],
    stats: {
      totalRevenue,
      monthlyRevenue,
      totalActiveSubscriptions: activeSubs.length,
      totalTransactions: (completedTxns || []).length,
      planDistribution,
    },
  });
}
