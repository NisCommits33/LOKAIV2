"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CreditCard,
  Check,
  Crown,
  Zap,
  Building2,
  Users,
  FileText,
  Brain,
  HardDrive,
  BarChart3,
  Download,
  AlertCircle,
  Clock,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { FullPageSpinner } from "@/components/loading";
import type {
  SubscriptionPlan,
  OrganizationSubscription,
  PaymentTransaction,
  SubscriptionUsage,
} from "@/types/database";

interface BillingData {
  subscription: (OrganizationSubscription & { plan: SubscriptionPlan }) | null;
  effectivePlan: SubscriptionPlan | null;
  usage: (Partial<SubscriptionUsage> & { users_count: number }) | null;
  isExpired: boolean;
  transactions: PaymentTransaction[];
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
}

interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_number: string | null;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-NP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatNPR(amount: number) {
  return `Rs. ${amount.toLocaleString("en-NP")}`;
}

const planIcons: Record<string, React.ElementType> = {
  free: Building2,
  basic: Zap,
  pro: Crown,
  enterprise: Crown,
};

const invoiceStatusStyles: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-emerald-100 text-emerald-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
};

type Tab = "billing" | "invoices";

export default function BillingPage() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <BillingContent />
    </Suspense>
  );
}

function BillingContent() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("billing");
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [gateway] = useState<"khalti">("khalti");
  const formRef = useRef<HTMLFormElement>(null);

  // Invoice state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [billingRes, plansRes, invoicesRes] = await Promise.all([
        fetch("/api/admin/billing"),
        fetch("/api/admin/billing/plans"),
        fetch("/api/admin/invoices"),
      ]);
      if (billingRes.ok) setBilling(await billingRes.json());
      if (plansRes.ok) {
        const data = await plansRes.json();
        setPlans(data.plans || []);
      }
      if (invoicesRes.ok) {
        const data = await invoicesRes.json();
        setInvoices(data.invoices || []);
        setPayments(data.payments || []);
      }
    } catch {
      toast.error("Failed to load billing data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle payment result from URL params
  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "success") {
      toast.success("Payment successful! Your plan has been upgraded.");
    } else if (payment === "failed") {
      const reason = searchParams.get("reason") || "Unknown error";
      toast.error(`Payment failed: ${reason}`);
    }
  }, [searchParams]);

  async function handleSubscribe(planId: string) {
    setProcessingPlanId(planId);
    try {
      const res = await fetch("/api/admin/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billingCycle, gateway }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to initiate payment");
      }

      const data = await res.json();

      if (data.gateway === "khalti") {
        // Khalti: simple redirect to payment URL
        window.location.href = data.paymentUrl;
      } else {
        // eSewa: requires a form POST submission
        const form = formRef.current;
        if (!form) return;

        form.action = data.paymentUrl;
        form.method = "POST";

        // Clear existing inputs
        form.innerHTML = "";

        // Add hidden fields
        Object.entries(data.formData).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        });

        form.submit();
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to initiate payment"
      );
      setProcessingPlanId(null);
    }
  }

  const getPaymentsForInvoice = (invoiceId: string) =>
    payments.filter((p) => p.invoice_id === invoiceId);

  if (isLoading) return <FullPageSpinner />;

  const currentPlan = billing?.subscription?.plan;
  const currentPlanName = currentPlan?.name || "free";

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 pb-12">


      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
          <CreditCard className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Billing & Invoices
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage your organization&apos;s subscription, payments, and invoices.
          </p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit">
        {([
          { key: "billing" as Tab, label: "Subscription & Payments" },
          { key: "invoices" as Tab, label: `Invoices (${invoices.length})` },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
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

      {/* ═══════ BILLING TAB ═══════ */}
      {tab === "billing" && (
        <>
          {/* Current Plan Card */}
          {billing?.subscription && currentPlan && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Current Plan:{" "}
                      <span
                        className={
                          billing.isExpired
                            ? "text-red-600 dark:text-red-400 font-bold"
                            : "text-indigo-600 dark:text-indigo-400"
                        }
                      >
                        {currentPlan.display_name}
                        {billing.isExpired && " — Expired"}
                      </span>
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {billing.subscription.billing_cycle === "yearly"
                        ? "Yearly"
                        : "Monthly"}{" "}
                      billing
                      {currentPlanName !== "free" && (
                        <>
                          {" "}
                          · Renews{" "}
                          {formatDate(billing.subscription.current_period_end)}
                        </>
                      )}
                    </p>
                  </div>
                </div>
                {billing.isExpired && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-4 py-2 rounded-lg">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Subscription expired — please renew
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Usage Meters */}
          {currentPlan && billing?.usage && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <UsageMeter
                icon={Users}
                label="Users"
                used={billing.usage.users_count || 0}
                limit={billing.effectivePlan?.max_users || currentPlan.max_users}
              />
              <UsageMeter
                icon={FileText}
                label="Documents"
                used={billing.usage.documents_used || 0}
                limit={
                  billing.effectivePlan?.max_documents_per_month ||
                  currentPlan.max_documents_per_month
                }
                period="this month"
              />
              <UsageMeter
                icon={Brain}
                label="AI Requests"
                used={billing.usage.ai_requests_used || 0}
                limit={
                  billing.effectivePlan?.max_ai_requests_per_month ||
                  currentPlan.max_ai_requests_per_month
                }
                period="this month"
              />
              <UsageMeter
                icon={HardDrive}
                label="Storage"
                used={billing.usage.storage_used_mb || 0}
                limit={
                  billing.effectivePlan?.max_storage_mb ||
                  currentPlan.max_storage_mb
                }
                unit="MB"
              />
            </div>
          )}

          {/* Billing Cycle Toggle */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
              <span
                className={`text-sm font-medium ${billingCycle === "monthly" ? "text-slate-900 dark:text-slate-100" : "text-slate-400"}`}
              >
                Monthly
              </span>
              <button
                onClick={() =>
                  setBillingCycle((c) => (c === "monthly" ? "yearly" : "monthly"))
                }
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  billingCycle === "yearly" ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    billingCycle === "yearly" ? "translate-x-7" : ""
                  }`}
                />
              </button>
              <span
                className={`text-sm font-medium ${billingCycle === "yearly" ? "text-slate-900 dark:text-slate-100" : "text-slate-400"}`}
              >
                Yearly{" "}
                <span className="text-green-600 text-xs font-semibold">
                  Save ~17%
                </span>
              </span>
            </div>

            {/* Payment Gateway Info */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 dark:text-slate-400 mr-1">Secured by:</span>
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-purple-500 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 text-sm font-medium"
              >
                <CreditCard className="h-4 w-4" />
                Khalti
              </div>
            </div>
          </div>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const isCurrentPlan = plan.name === currentPlanName;
              const PlanIcon = planIcons[plan.name] || Building2;
              const price =
                billingCycle === "yearly"
                  ? plan.price_yearly
                  : plan.price_monthly;
              const isPopular = plan.name === "pro";

              return (
                <div
                  key={plan.id}
                  className={`relative bg-white dark:bg-slate-900 rounded-xl border-2 p-6 flex flex-col transition-all ${
                    isPopular
                      ? "border-indigo-500 shadow-lg shadow-indigo-100 dark:shadow-indigo-950/30"
                      : isCurrentPlan
                        ? "border-green-300 dark:border-green-700 bg-green-50/30 dark:bg-green-950/20"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      POPULAR
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        isPopular
                          ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <PlanIcon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {plan.display_name}
                    </h3>
                  </div>

                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{plan.description}</p>

                  <div className="mb-6">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                      {price === 0 ? "Free" : formatNPR(price)}
                    </span>
                    {price > 0 && (
                      <span className="text-slate-500 dark:text-slate-400 text-sm">
                      </span>
                    )}
                  </div>

                  {/* Feature list */}
                  <ul className="space-y-2 mb-6 flex-1">
                    <PlanFeature
                      label={`${plan.max_users === -1 ? "Unlimited" : plan.max_users} users`}
                    />
                    <PlanFeature
                      label={`${plan.max_documents_per_month === -1 ? "Unlimited" : plan.max_documents_per_month} docs/month`}
                    />
                    <PlanFeature
                      label={`${plan.max_ai_requests_per_month === -1 ? "Unlimited" : plan.max_ai_requests_per_month} AI requests/month`}
                    />
                    <PlanFeature
                      label={`${plan.max_storage_mb === -1 ? "Unlimited" : plan.max_storage_mb >= 1024 ? `${(plan.max_storage_mb / 1024).toFixed(0)} GB` : `${plan.max_storage_mb} MB`} storage`}
                    />
                    {plan.has_advanced_analytics && (
                      <PlanFeature label="Advanced analytics" icon={BarChart3} />
                    )}
                    {plan.has_export && (
                      <PlanFeature label="Data export" icon={Download} />
                    )}
                  </ul>

                  {/* Action button */}
                  {isCurrentPlan ? (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold text-sm cursor-default"
                    >
                      Current Plan
                    </button>
                  ) : plan.name === "free" ? (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 font-semibold text-sm cursor-default"
                    >
                      Default
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={!!processingPlanId}
                      className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                        isPopular
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                          : "bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900"
                      } disabled:opacity-50`}
                    >
                      {processingPlanId === plan.id
                        ? `Redirecting to Khalti...`
                        : `Upgrade to ${plan.display_name}`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Payment History */}
          {billing?.transactions && billing.transactions.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Payment History
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                      <th className="px-6 py-3 font-medium">Date</th>
                      <th className="px-6 py-3 font-medium">Amount</th>
                      <th className="px-6 py-3 font-medium">Gateway</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium">Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billing.transactions.map((txn) => (
                      <tr
                        key={txn.id}
                        className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <td className="px-6 py-4 text-slate-900 dark:text-slate-100">
                          {formatDate(txn.created_at)}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                          {formatNPR(txn.total_amount)}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 uppercase text-xs font-semibold">
                          {txn.gateway}
                        </td>
                        <td className="px-6 py-4">
                          <PaymentStatusBadge status={txn.status} />
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs">
                          {txn.gateway_transaction_id || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════ INVOICES TAB ═══════ */}
      {tab === "invoices" && (
        <>
          {invoices.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-slate-500">
                No invoices yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {invoices.map((inv) => {
                const invPayments = getPaymentsForInvoice(inv.id);
                const totalPaid = invPayments.reduce((s, p) => s + Number(p.amount), 0);

                return (
                  <Card key={inv.id}>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {inv.invoice_number}
                          </p>
                          {inv.purchase_order_number && (
                            <p className="text-xs text-slate-500">
                              PO: {inv.purchase_order_number}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              window.open(`/api/admin/invoices/${inv.id}/pdf`, "_blank");
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            <Download className="h-3.5 w-3.5" />
                            PDF
                          </button>
                          <Badge className={invoiceStatusStyles[inv.status] || "bg-slate-100 text-slate-600"}>
                            {inv.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-slate-500">Amount:</span>{" "}
                          <span className="font-medium">{formatNPR(inv.amount)}</span>
                        </div>
                        {inv.tax_amount > 0 && (
                          <div>
                            <span className="text-slate-500">Tax:</span>{" "}
                            {formatNPR(inv.tax_amount)}
                          </div>
                        )}
                        <div>
                          <span className="text-slate-500">Total:</span>{" "}
                          <span className="font-semibold">{formatNPR(inv.total_amount)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Due:</span>{" "}
                          {formatDate(inv.due_date)}
                        </div>
                      </div>

                      {inv.notes && (
                        <p className="text-xs text-slate-500">{inv.notes}</p>
                      )}

                      {/* Payments */}
                      {invPayments.length > 0 && (
                        <div className="mt-2 border-t pt-3">
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                            Payments ({formatNPR(totalPaid)} of {formatNPR(inv.total_amount)})
                          </p>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs">Date</TableHead>
                                <TableHead className="text-xs">Amount</TableHead>
                                <TableHead className="text-xs">Method</TableHead>
                                <TableHead className="text-xs">Ref #</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {invPayments.map((p) => (
                                <TableRow key={p.id}>
                                  <TableCell className="text-xs">{formatDate(p.payment_date)}</TableCell>
                                  <TableCell className="text-xs">{formatNPR(p.amount)}</TableCell>
                                  <TableCell className="text-xs capitalize">{p.payment_method.replace("_", " ")}</TableCell>
                                  <TableCell className="text-xs">{p.reference_number || "—"}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function UsageMeter({
  icon: Icon,
  label,
  used,
  limit,
  period,
  unit,
}: {
  icon: React.ElementType;
  label: string;
  used: number;
  limit: number;
  period?: string;
  unit?: string;
}) {
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : limit > 0 ? (used / limit) * 100 : 0;
  const isNearLimit = percentage >= 80;
  const isOverLimit = percentage >= 100;

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <Icon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {used}
          {unit && <span className="text-sm font-normal ml-0.5">{unit}</span>}
        </span>
        <span className="text-slate-400 text-sm">
          / {isUnlimited ? "∞" : `${limit}${unit ? ` ${unit}` : ""}`}
        </span>
      </div>
      {!isUnlimited && (
        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              isOverLimit
                ? "bg-red-500"
                : isNearLimit
                  ? "bg-amber-500"
                  : "bg-indigo-500"
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
      {period && (
        <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
          <Clock className="h-3 w-3" /> {period}
        </p>
      )}
    </div>
  );
}

function PlanFeature({
  label,
  icon: Icon,
}: {
  label: string;
  icon?: React.ElementType;
}) {
  const FeatureIcon = Icon || Check;
  return (
    <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
      <FeatureIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
      {label}
    </li>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    initiated: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
    failed: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    refunded: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status] || styles.initiated}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
