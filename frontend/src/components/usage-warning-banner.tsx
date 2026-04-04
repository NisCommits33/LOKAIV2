"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, X } from "lucide-react";
import Link from "next/link";

type UsageWarning = {
  feature: string;
  label: string;
  used: number;
  limit: number;
  percentage: number;
  level: "ok" | "warning" | "critical";
};

type UsageStatus = {
  plan: string;
  isExpired: boolean;
  warnings: UsageWarning[];
  hasWarnings: boolean;
};

export function UsageWarningBanner() {
  const [status, setStatus] = useState<UsageStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch("/api/admin/usage-status");
        if (!res.ok) return;
        const data = await res.json();
        setStatus(data);
      } catch {
        // Silently fail — banner is non-critical
      }
    }
    fetchStatus();
  }, []);

  if (!status || dismissed) return null;

  // Show expired banner
  if (status.isExpired) {
    return (
      <div className="mx-4 sm:mx-8 mt-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-800 dark:text-red-200">
              Subscription Expired
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              Your {status.plan} plan has expired. You are now limited to Free plan quotas.
              Upgrade to restore full access.
            </p>
            <Link
              href="/admin/billing"
              className="inline-flex items-center gap-1 text-sm font-medium text-red-700 dark:text-red-300 hover:underline mt-2"
            >
              Upgrade Plan <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-red-400 hover:text-red-600 dark:hover:text-red-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Filter to only warning/critical items
  const activeWarnings = status.warnings.filter((w) => w.level !== "ok");
  if (activeWarnings.length === 0) return null;

  const hasCritical = activeWarnings.some((w) => w.level === "critical");

  return (
    <div
      className={`mx-4 sm:mx-8 mt-4 rounded-lg border p-4 ${
        hasCritical
          ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30"
          : "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30"
      }`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className={`h-5 w-5 mt-0.5 shrink-0 ${
            hasCritical
              ? "text-red-600 dark:text-red-400"
              : "text-amber-600 dark:text-amber-400"
          }`}
        />
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-semibold ${
              hasCritical
                ? "text-red-800 dark:text-red-200"
                : "text-amber-800 dark:text-amber-200"
            }`}
          >
            {hasCritical ? "Usage Limit Reached" : "Approaching Usage Limits"}
          </p>
          <div className="mt-2 space-y-1.5">
            {activeWarnings.map((w) => (
              <div key={w.feature} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={
                        hasCritical
                          ? "text-red-700 dark:text-red-300"
                          : "text-amber-700 dark:text-amber-300"
                      }
                    >
                      {w.label}
                    </span>
                    <span
                      className={`font-medium ${
                        w.level === "critical"
                          ? "text-red-800 dark:text-red-200"
                          : "text-amber-800 dark:text-amber-200"
                      }`}
                    >
                      {w.used}/{w.limit} ({w.percentage}%)
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        w.level === "critical"
                          ? "bg-red-500"
                          : "bg-amber-500"
                      }`}
                      style={{ width: `${Math.min(w.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/admin/billing"
            className={`inline-flex items-center gap-1 text-sm font-medium hover:underline mt-3 ${
              hasCritical
                ? "text-red-700 dark:text-red-300"
                : "text-amber-700 dark:text-amber-300"
            }`}
          >
            Upgrade Plan <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className={
            hasCritical
              ? "text-red-400 hover:text-red-600 dark:hover:text-red-300"
              : "text-amber-400 hover:text-amber-600 dark:hover:text-amber-300"
          }
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
