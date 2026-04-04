"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CreditCard,
  DollarSign,
  Building2,
  TrendingUp,
  Search,
  BarChart3,
  ArrowUpDown,
  Calendar,
  FileText,
  Plus,
  Send,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Download,
} from "lucide-react";
import { toast } from "sonner";

/* ─── Types ─── */

interface PlanDistribution { name: string; count: number; }

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
  plan: { id: string; name: string; display_name: string; price_monthly: number; price_yearly: number } | null;
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

interface Plan {
  id: string;
  name: string;
  display_name: string;
  price_monthly: number;
  price_yearly: number;
}

interface OrgSubscriptionDetail {
  organization: { id: string; name: string };
  subscription: {
    id: string;
    status: string;
    billing_cycle: string;
    current_period_start: string;
    current_period_end: string;
    plan: { id: string; name: string; display_name: string; price_monthly: number; price_yearly: number };
  } | null;
  usage: {
    current: { users_used: number; documents_used: number; ai_requests_used: number; storage_used_mb: number } | null;
    users_count: number;
    history: Array<{ period_start: string; users_used: number; documents_used: number; ai_requests_used: number; storage_used_mb: number }>;
  };
  isExpired: boolean;
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  issue_date: string;
  due_date: string;
  purchase_order_number: string | null;
  notes: string | null;
  created_at: string;
  organization: { id: string; name: string } | null;
}

interface OrgOption { id: string; name: string; }

/* ─── Helpers ─── */

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
  suspended: "bg-amber-100 text-amber-700",
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-emerald-100 text-emerald-700",
  overdue: "bg-red-100 text-red-700",
};

type Tab = "overview" | "subscriptions" | "transactions" | "invoices";

/* ─── Component ─── */

export default function SuperAdminBillingPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Overview & shared data
  const [stats, setStats] = useState<Stats | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);

  // Transaction verify
  const [verifyingTxnId, setVerifyingTxnId] = useState<string | null>(null);
  const [customYears, setCustomYears] = useState<Record<string, string>>({});

  // Subscription detail
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedOrgName, setSelectedOrgName] = useState("");
  const [subDetail, setSubDetail] = useState<OrgSubscriptionDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Change plan
  const [changePlanOrgId, setChangePlanOrgId] = useState<string | null>(null);
  const [changePlanOrgName, setChangePlanOrgName] = useState("");
  const [newPlanId, setNewPlanId] = useState("");
  const [newBillingCycle, setNewBillingCycle] = useState("monthly");
  const [isChanging, setIsChanging] = useState(false);

  // Extend
  const [extendOrgId, setExtendOrgId] = useState<string | null>(null);
  const [extendOrgName, setExtendOrgName] = useState("");
  const [extensionDays, setExtensionDays] = useState("30");
  const [isExtending, setIsExtending] = useState(false);

  // Invoices
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");

  // Create invoice
  const [showCreate, setShowCreate] = useState(false);
  const [createOrgId, setCreateOrgId] = useState("");
  const [createAmount, setCreateAmount] = useState("");
  const [createTax, setCreateTax] = useState("0");
  const [createDueDays, setCreateDueDays] = useState("30");
  const [createPO, setCreatePO] = useState("");
  const [createNotes, setCreateNotes] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Record payment
  const [payInvoice, setPayInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("bank_transfer");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  /* ─── Data Fetching ─── */

  const fetchBilling = useCallback(async () => {
    try {
      const res = await fetch("/api/super/billing");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setStats(data.stats);
      setSubscriptions(data.subscriptions || []);
      setTransactions(data.transactions || []);
      setPlans(data.plans || []);
      // Build org list for invoices
      const orgMap = new Map<string, string>();
      for (const sub of data.subscriptions || []) {
        if (sub.organization) orgMap.set(sub.organization.id, sub.organization.name);
      }
      setOrgs(Array.from(orgMap.entries()).map(([id, name]) => ({ id, name })));
    } catch {
      toast.error("Failed to load billing data");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInvoices = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.set("status", filterStatus);
      const res = await fetch(`/api/super/invoices?${params}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch {
      toast.error("Failed to load invoices");
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  /* ─── Subscription Handlers ─── */

  // Deduplicate: latest sub per org
  const orgMap = new Map<string, Subscription>();
  for (const sub of subscriptions) {
    if (!sub.organization) continue;
    const existing = orgMap.get(sub.organization.id);
    if (!existing || new Date(sub.created_at) > new Date(existing.created_at)) {
      orgMap.set(sub.organization.id, sub);
    }
  }
  const latestSubs = Array.from(orgMap.values());

  const openDetail = async (orgId: string, orgName: string) => {
    setSelectedOrgId(orgId);
    setSelectedOrgName(orgName);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/super/subscriptions/${orgId}`);
      if (!res.ok) throw new Error("Failed to load");
      setSubDetail(await res.json());
    } catch {
      toast.error("Failed to load subscription details");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleChangePlan = async () => {
    if (!changePlanOrgId || !newPlanId) return;
    setIsChanging(true);
    try {
      const res = await fetch(`/api/super/subscriptions/${changePlanOrgId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change_plan", planId: newPlanId, billingCycle: newBillingCycle }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      const d = await res.json();
      toast.success(d.message || "Plan changed successfully");
      setChangePlanOrgId(null);
      setNewPlanId("");
      fetchBilling();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to change plan");
    } finally {
      setIsChanging(false);
    }
  };

  const handleExtend = async () => {
    if (!extendOrgId) return;
    const days = parseInt(extensionDays);
    if (!days || days < 1) { toast.error("Enter a valid number of days"); return; }
    setIsExtending(true);
    try {
      const res = await fetch(`/api/super/subscriptions/${extendOrgId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extend", extensionDays: days }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      const d = await res.json();
      toast.success(d.message || "Subscription extended");
      setExtendOrgId(null);
      setExtensionDays("30");
      fetchBilling();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to extend");
    } finally {
      setIsExtending(false);
    }
  };

  const handleCancel = async (orgId: string, orgName: string) => {
    if (!confirm(`Cancel subscription for ${orgName}? This will revert them to the Free plan.`)) return;
    try {
      const res = await fetch(`/api/super/subscriptions/${orgId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      toast.success(`Subscription cancelled for ${orgName}`);
      fetchBilling();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to cancel");
    }
  };

  /* ─── Transaction Handlers ─── */

  async function handleVerifyPayment(transactionId: string) {
    setVerifyingTxnId(transactionId);
    try {
      const years = parseInt(customYears[transactionId] || "0");
      const res = await fetch("/api/admin/billing/check-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, customYears: years > 0 ? years : undefined }),
      });
      const data = await res.json();
      if (data.status === "completed") { toast.success("Payment verified and subscription activated."); fetchBilling(); }
      else if (data.status === "failed") { toast.error(data.message || "Payment was not completed"); fetchBilling(); }
      else if (data.status === "pending") { toast.info(data.message || "Payment is still pending"); }
      else { toast.error(data.error || "Failed to verify payment"); }
    } catch { toast.error("Failed to check payment status"); }
    finally { setVerifyingTxnId(null); }
  }

  /* ─── Invoice Handlers ─── */

  const resetCreateForm = () => {
    setCreateOrgId(""); setCreateAmount(""); setCreateTax("0");
    setCreateDueDays("30"); setCreatePO(""); setCreateNotes("");
  };

  const handleCreateInvoice = async () => {
    const amount = parseFloat(createAmount);
    const taxAmount = parseFloat(createTax) || 0;
    if (!createOrgId || !amount || amount <= 0) { toast.error("Organization and a valid amount are required"); return; }
    setIsCreating(true);
    try {
      const res = await fetch("/api/super/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: createOrgId, amount, taxAmount,
          dueDays: parseInt(createDueDays) || 30,
          purchaseOrderNumber: createPO || undefined,
          notes: createNotes || undefined,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      toast.success("Invoice created");
      setShowCreate(false);
      resetCreateForm();
      fetchInvoices();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create invoice");
    } finally { setIsCreating(false); }
  };

  const handleStatusChange = async (invoiceId: string, status: string) => {
    try {
      const res = await fetch(`/api/super/invoices/${invoiceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      toast.success(`Invoice marked as ${status}`);
      fetchInvoices();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    }
  };

  const handleRecordPayment = async () => {
    if (!payInvoice) return;
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) { toast.error("Enter a valid payment amount"); return; }
    setIsRecording(true);
    try {
      const res = await fetch(`/api/super/invoices/${payInvoice.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount, paymentMethod: payMethod,
          referenceNumber: payRef || undefined,
          notes: payNotes || undefined,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      toast.success("Payment recorded");
      setPayInvoice(null); setPayAmount(""); setPayRef(""); setPayNotes("");
      fetchInvoices();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to record payment");
    } finally { setIsRecording(false); }
  };

  /* ─── Filtered lists ─── */

  const filteredSubs = latestSubs.filter(
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

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      inv.organization?.name?.toLowerCase().includes(search.toLowerCase())
  );

  /* ─── Loading state ─── */

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

  /* ─── Render ─── */

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Billing & Subscriptions
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage subscriptions, revenue, transactions, and invoices across all organizations.
            </p>
          </div>
        </div>
        {tab === "invoices" && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" /> Create Invoice
          </Button>
        )}
      </div>

      {/* Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          {(
            [
              { key: "overview", label: "Overview" },
              { key: "subscriptions", label: `Subscriptions (${latestSubs.length})` },
              { key: "transactions", label: `Transactions (${transactions.length})` },
              { key: "invoices", label: `Invoices (${invoices.length})` },
            ] as { key: Tab; label: string }[]
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSearch(""); }}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                tab === t.key
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab !== "overview" && (
          <div className="flex items-center gap-2">
            {tab === "invoices" && (
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            )}
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}
      </div>

      {/* ═══════ OVERVIEW TAB ═══════ */}
      {tab === "overview" && (
        <>
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={DollarSign} label="Total Revenue" value={formatNPR(stats.totalRevenue)} sub="All time" />
              <StatCard icon={TrendingUp} label="This Month" value={formatNPR(stats.monthlyRevenue)} sub="Current month revenue" />
              <StatCard icon={Building2} label="Active Subscriptions" value={String(stats.totalActiveSubscriptions)} sub="Across all orgs" />
              <StatCard icon={BarChart3} label="Completed Payments" value={String(stats.totalTransactions)} sub="Successful transactions" />
            </div>
          )}

          {stats && stats.planDistribution.length > 0 && (
            <Card>
              <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/50 py-4 px-6">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Plan Distribution</h2>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-end gap-6">
                  {stats.planDistribution.map((p) => {
                    const total = stats.totalActiveSubscriptions || 1;
                    const pct = Math.round((p.count / total) * 100);
                    return (
                      <div key={p.name} className="flex flex-col items-center gap-2 flex-1">
                        <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{p.count}</span>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                          <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{p.name} ({pct}%)</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ═══════ SUBSCRIPTIONS TAB ═══════ */}
      {tab === "subscriptions" && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Period End</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-500 py-8">No subscriptions found</TableCell>
                  </TableRow>
                ) : (
                  filteredSubs.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{sub.organization?.name || "Unknown"}</TableCell>
                      <TableCell>{sub.plan?.display_name || "—"}</TableCell>
                      <TableCell>
                        <Badge className={statusStyles[sub.status] || "bg-slate-100 text-slate-600"}>{sub.status}</Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">{formatDate(sub.current_period_end)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openDetail(sub.organization!.id, sub.organization!.name)}>View</Button>
                        <Button variant="outline" size="sm" onClick={() => { setChangePlanOrgId(sub.organization!.id); setChangePlanOrgName(sub.organization!.name); setNewPlanId(""); }}>
                          <ArrowUpDown className="h-3.5 w-3.5 mr-1" /> Change Plan
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { setExtendOrgId(sub.organization!.id); setExtendOrgName(sub.organization!.name); }}>
                          <Calendar className="h-3.5 w-3.5 mr-1" /> Extend
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                          onClick={() => handleCancel(sub.organization!.id, sub.organization!.name)}>
                          Cancel
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ═══════ TRANSACTIONS TAB ═══════ */}
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
                    <TableCell colSpan={8} className="text-center py-8 text-slate-400">No transactions found</TableCell>
                  </TableRow>
                ) : (
                  filteredTxns.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell className="text-slate-600 dark:text-slate-400">{formatDate(txn.created_at)}</TableCell>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">{txn.organization?.name || "—"}</TableCell>
                      <TableCell>{txn.plan?.display_name || "—"}</TableCell>
                      <TableCell className="font-semibold text-slate-900 dark:text-slate-100">{formatNPR(txn.total_amount)}</TableCell>
                      <TableCell className="uppercase text-xs font-semibold text-slate-500 dark:text-slate-400">{txn.gateway}</TableCell>
                      <TableCell>
                        <Badge className={statusStyles[txn.status] || statusStyles.initiated} variant="secondary">{txn.status}</Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 dark:text-slate-400 font-mono text-xs">{txn.gateway_transaction_id || "—"}</TableCell>
                      <TableCell>
                        {txn.status === "initiated" && (
                          <div className="flex items-center gap-2">
                            <Input type="number" placeholder="Years" className="w-16 h-8 text-xs" min="1"
                              value={customYears[txn.id] || ""}
                              onChange={(e) => setCustomYears((prev) => ({ ...prev, [txn.id]: e.target.value }))} />
                            <button onClick={() => handleVerifyPayment(txn.id)} disabled={verifyingTxnId === txn.id}
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50 whitespace-nowrap">
                              {verifyingTxnId === txn.id ? "Verifying..." : "Verify"}
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

      {/* ═══════ INVOICES TAB ═══════ */}
      {tab === "invoices" && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">No invoices found</TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium font-mono text-sm">{inv.invoice_number}</TableCell>
                      <TableCell>{inv.organization?.name || "—"}</TableCell>
                      <TableCell>{formatNPR(inv.total_amount)}</TableCell>
                      <TableCell>
                        <Badge className={statusStyles[inv.status] || "bg-slate-100 text-slate-600"}>{inv.status}</Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">{formatDate(inv.due_date)}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="outline" size="sm" onClick={() => window.open(`/api/admin/invoices/${inv.id}/pdf`, "_blank")}>
                          <Download className="h-3.5 w-3.5 mr-1" /> PDF
                        </Button>
                        {inv.status === "draft" && (
                          <Button variant="outline" size="sm" onClick={() => handleStatusChange(inv.id, "sent")}>
                            <Send className="h-3.5 w-3.5 mr-1" /> Send
                          </Button>
                        )}
                        {(inv.status === "sent" || inv.status === "overdue") && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => { setPayInvoice(inv); setPayAmount(String(inv.total_amount)); }}>
                              <DollarSign className="h-3.5 w-3.5 mr-1" /> Record Payment
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleStatusChange(inv.id, "paid")}>
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark Paid
                            </Button>
                          </>
                        )}
                        {inv.status !== "cancelled" && inv.status !== "paid" && (
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleStatusChange(inv.id, "cancelled")}>
                            <XCircle className="h-3.5 w-3.5 mr-1" /> Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ═══════ DIALOGS ═══════ */}

      {/* Subscription Detail Dialog */}
      <Dialog open={!!selectedOrgId} onOpenChange={() => setSelectedOrgId(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" /> {selectedOrgName} — Subscription Details
            </DialogTitle>
          </DialogHeader>
          {loadingDetail ? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : subDetail ? (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-2">
                <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">Current Plan</h3>
                {subDetail.subscription ? (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-slate-500">Plan:</span> <span className="font-medium">{subDetail.subscription.plan.display_name}</span></div>
                    <div>
                      <span className="text-slate-500">Status:</span>{" "}
                      <Badge className={statusStyles[subDetail.subscription.status] || "bg-slate-100 text-slate-600"}>{subDetail.subscription.status}</Badge>
                      {subDetail.isExpired && <Badge className="ml-1 bg-red-100 text-red-700">Expired</Badge>}
                    </div>
                    <div><span className="text-slate-500">Billing:</span> {subDetail.subscription.billing_cycle}</div>
                    <div><span className="text-slate-500">Period:</span> {formatDate(subDetail.subscription.current_period_start)} — {formatDate(subDetail.subscription.current_period_end)}</div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No active subscription</p>
                )}
              </div>
              <div className="rounded-lg border p-4 space-y-2">
                <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">Current Usage</h3>
                {subDetail.usage.current ? (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-slate-500">Users:</span> {subDetail.usage.users_count}</div>
                    <div><span className="text-slate-500">Documents:</span> {subDetail.usage.current.documents_used}</div>
                    <div><span className="text-slate-500">AI Requests:</span> {subDetail.usage.current.ai_requests_used}</div>
                    <div><span className="text-slate-500">Storage:</span> {subDetail.usage.current.storage_used_mb.toFixed(1)} MB</div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No usage data</p>
                )}
              </div>
              {subDetail.usage.history.length > 0 && (
                <div className="rounded-lg border p-4 space-y-2">
                  <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">Usage History</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Period</TableHead>
                        <TableHead className="text-xs">Docs</TableHead>
                        <TableHead className="text-xs">AI</TableHead>
                        <TableHead className="text-xs">Storage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subDetail.usage.history.map((h, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs">{formatDate(h.period_start)}</TableCell>
                          <TableCell className="text-xs">{h.documents_used}</TableCell>
                          <TableCell className="text-xs">{h.ai_requests_used}</TableCell>
                          <TableCell className="text-xs">{h.storage_used_mb.toFixed(1)} MB</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Change Plan Dialog */}
      <Dialog open={!!changePlanOrgId} onOpenChange={() => setChangePlanOrgId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Plan — {changePlanOrgName}</DialogTitle>
            <DialogDescription>Select a new subscription plan and billing cycle.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select value={newPlanId} onValueChange={setNewPlanId}>
                <SelectTrigger><SelectValue placeholder="Select a plan" /></SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.display_name} — {formatNPR(p.price_monthly)}/mo</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Billing Cycle</Label>
              <Select value={newBillingCycle} onValueChange={setNewBillingCycle}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePlanOrgId(null)}>Cancel</Button>
            <Button onClick={handleChangePlan} disabled={!newPlanId || isChanging}>
              {isChanging && <RefreshCw className="h-4 w-4 animate-spin mr-2" />} Change Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Dialog */}
      <Dialog open={!!extendOrgId} onOpenChange={() => setExtendOrgId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Subscription — {extendOrgName}</DialogTitle>
            <DialogDescription>Add days to the current subscription period.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Extension Days</Label>
            <Input type="number" min="1" value={extensionDays} onChange={(e) => setExtensionDays(e.target.value)} placeholder="30" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendOrgId(null)}>Cancel</Button>
            <Button onClick={handleExtend} disabled={isExtending}>
              {isExtending && <RefreshCw className="h-4 w-4 animate-spin mr-2" />} Extend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Invoice Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
            <DialogDescription>Generate a new invoice for an organization.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Organization</Label>
              <Select value={createOrgId} onValueChange={setCreateOrgId}>
                <SelectTrigger><SelectValue placeholder="Select organization" /></SelectTrigger>
                <SelectContent>
                  {orgs.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Amount (NPR)</Label>
                <Input type="number" min="0" step="0.01" value={createAmount} onChange={(e) => setCreateAmount(e.target.value)} placeholder="5000" />
              </div>
              <div className="space-y-2">
                <Label>Tax (NPR)</Label>
                <Input type="number" min="0" step="0.01" value={createTax} onChange={(e) => setCreateTax(e.target.value)} placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Due Days</Label>
                <Input type="number" min="1" value={createDueDays} onChange={(e) => setCreateDueDays(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>PO Number</Label>
                <Input value={createPO} onChange={(e) => setCreatePO(e.target.value)} placeholder="Optional" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={createNotes} onChange={(e) => setCreateNotes(e.target.value)} placeholder="Optional notes..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreateInvoice} disabled={isCreating}>
              {isCreating && <RefreshCw className="h-4 w-4 animate-spin mr-2" />} Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={!!payInvoice} onOpenChange={() => setPayInvoice(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment — {payInvoice?.invoice_number}</DialogTitle>
            <DialogDescription>Record a manual payment for this invoice ({payInvoice ? formatNPR(payInvoice.total_amount) : ""}).</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Amount (NPR)</Label>
              <Input type="number" min="0" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={payMethod} onValueChange={setPayMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reference Number</Label>
              <Input value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={payNotes} onChange={(e) => setPayNotes(e.target.value)} placeholder="Optional" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayInvoice(null)}>Cancel</Button>
            <Button onClick={handleRecordPayment} disabled={isRecording}>
              {isRecording && <RefreshCw className="h-4 w-4 animate-spin mr-2" />} Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string; sub: string }) {
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
