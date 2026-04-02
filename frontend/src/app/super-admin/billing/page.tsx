"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CreditCard,
  DollarSign,
  Building2,
  TrendingUp,
  Search,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";

interface PlanDistribution {
  name: string;
  count: number;
}

interface Stats {
  totalRevenue: number;
  monthlyRevenue: number;
  totalActiveSubscriptions: number;
  totalTransactions: number;
  planDistribution: PlanDistribution[];
}

interface Subscription {
  id: string;
  status: string;
  billing_cycle: string;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  organization: { id: string; name: string } | null;
  plan: { display_name: string; name: string; price_monthly: number; price_yearly: number } | null;
}

interface Transaction {
  id: string;
  total_amount: number;
  status: string;
  gateway: string;
  gateway_transaction_id: string | null;
  billing_cycle: string;
  created_at: string;
  completed_at: string | null;
  organization: { id: string; name: string } | null;
  plan: { name: string; display_name: string } | null;
}

function formatNPR(amount: number) {
  return `Rs. ${amount.toLocaleString("en-NP")}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-NP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const statusStyles: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  expired: "bg-slate-100 text-slate-600",
  cancelled: "bg-red-100 text-red-700",
  pending: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  initiated: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-slate-100 text-slate-600",
};

export default function SuperAdminBillingPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [verifyingTxnId, setVerifyingTxnId] = useState<string | null>(null);
  const [customYears, setCustomYears] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"subscriptions" | "transactions">(
    "subscriptions"
  );

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/super/billing");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setStats(data.stats);
      setSubscriptions(data.subscriptions);
      setTransactions(data.transactions);
    } catch {
      toast.error("Failed to load billing data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredSubs = subscriptions.filter(
    (s) =>
      s.organization?.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.plan?.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.status.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTxns = transactions.filter(
    (t) =>
      t.organization?.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.plan?.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.status.toLowerCase().includes(search.toLowerCase())
  );

  async function handleVerifyPayment(transactionId: string) {
    setVerifyingTxnId(transactionId);
    try {
      const years = parseInt(customYears[transactionId] || "0");
      const res = await fetch("/api/admin/billing/check-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          transactionId,
          customYears: years > 0 ? years : undefined
        }),
      });

      const data = await res.json();

      if (data.status === "completed") {
        toast.success("Payment verified and subscription activated.");
        fetchData();
      } else if (data.status === "failed") {
        toast.error(data.message || "Payment was not completed");
        fetchData();
      } else if (data.status === "pending") {
        toast.info(data.message || "Payment is still pending at eSewa");
      } else {
        toast.error(data.error || "Failed to verify payment");
      }
    } catch {
      toast.error("Failed to check payment status");
    } finally {
      setVerifyingTxnId(null);
    }
  }

  if (loading) {
    return (
      <div className="p-6 sm:p-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-slate-900 dark:bg-slate-100 p-2 text-white dark:text-slate-900">
          <CreditCard className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Billing Overview
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Monitor subscriptions, revenue, and payment transactions across all
            organizations.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={DollarSign}
            label="Total Revenue"
            value={formatNPR(stats.totalRevenue)}
            sub="All time"
          />
          <StatCard
            icon={TrendingUp}
            label="This Month"
            value={formatNPR(stats.monthlyRevenue)}
            sub="Current month revenue"
          />
          <StatCard
            icon={Building2}
            label="Active Subscriptions"
            value={String(stats.totalActiveSubscriptions)}
            sub="Across all orgs"
          />
          <StatCard
            icon={BarChart3}
            label="Completed Payments"
            value={String(stats.totalTransactions)}
            sub="Successful transactions"
          />
        </div>
      )}

      {/* Plan Distribution */}
      {stats && stats.planDistribution.length > 0 && (
        <Card>
          <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/50 py-4 px-6">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Plan Distribution
            </h2>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-end gap-6">
              {stats.planDistribution.map((p) => {
                const total = stats.totalActiveSubscriptions || 1;
                const pct = Math.round((p.count / total) * 100);
                return (
                  <div key={p.name} className="flex flex-col items-center gap-2 flex-1">
                    <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {p.count}
                    </span>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-indigo-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {p.name} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => setTab("subscriptions")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              tab === "subscriptions"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Subscriptions ({subscriptions.length})
          </button>
          <button
            onClick={() => setTab("transactions")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              tab === "transactions"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Transactions ({transactions.length})
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by organization, plan, or status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </div>

      {/* Subscriptions Table */}
      {tab === "subscriptions" && (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead>Period Start</TableHead>
                  <TableHead>Period End</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-slate-400"
                    >
                      No subscriptions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubs.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                        {sub.organization?.name || "—"}
                      </TableCell>
                      <TableCell>{sub.plan?.display_name || "—"}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            statusStyles[sub.status] || statusStyles.pending
                          }
                          variant="secondary"
                        >
                          {sub.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize text-slate-600 dark:text-slate-400">
                        {sub.billing_cycle}
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">
                        {formatDate(sub.current_period_start)}
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">
                        {formatDate(sub.current_period_end)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Transactions Table */}
      {tab === "transactions" && (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Gateway</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTxns.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-slate-400"
                    >
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTxns.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell className="text-slate-600 dark:text-slate-400">
                        {formatDate(txn.created_at)}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                        {txn.organization?.name || "—"}
                      </TableCell>
                      <TableCell>{txn.plan?.display_name || "—"}</TableCell>
                      <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                        {formatNPR(txn.total_amount)}
                      </TableCell>
                      <TableCell className="uppercase text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {txn.gateway}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            statusStyles[txn.status] || statusStyles.initiated
                          }
                          variant="secondary"
                        >
                          {txn.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 dark:text-slate-400 font-mono text-xs">
                        {txn.gateway_transaction_id || "—"}
                      </TableCell>
                      <TableCell>
                        {txn.status === "initiated" && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              placeholder="Years"
                              className="w-16 h-8 text-xs"
                              min="1"
                              value={customYears[txn.id] || ""}
                              onChange={(e) =>
                                setCustomYears((prev) => ({
                                  ...prev,
                                  [txn.id]: e.target.value,
                                }))
                              }
                            />
                            <button
                              onClick={() => handleVerifyPayment(txn.id)}
                              disabled={verifyingTxnId === txn.id}
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50 whitespace-nowrap"
                            >
                              {verifyingTxnId === txn.id
                                ? "Verifying..."
                                : "Verify"}
                            </button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
        </div>
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}
