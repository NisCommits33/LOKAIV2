/**
 * admin/page.tsx — Organization Admin Dashboard
 *
 * Overview dashboard for organization admins showing:
 * - Pending verification count with quick action link
 * - Key organization stats (total users, departments)
 * - Quick action cards for common admin tasks
 *
 * @module app/admin
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/loading";
import {
  ShieldCheck,
  Users,
  Building2,
  Clock,
  ArrowRight,
  CheckCircle2,
  Upload,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminPage() {
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/verifications/pending");
      if (res.ok) {
        const data = await res.json();
        setPendingCount(Array.isArray(data) ? data.length : 0);
      }
    } catch {
      // Silent fail — not critical for dashboard render
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="p-6 sm:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Organization Admin
        </h1>
        <p className="text-slate-500 font-medium mt-1">
          Manage your organization&apos;s users, departments, and documents.
        </p>
      </div>

      {/* Pending Verifications Alert */}
      {!isLoading && pendingCount !== null && pendingCount > 0 && (
        <Link href="/admin/verifications">
          <Card className="shadow-none border border-amber-100 bg-amber-50/50 hover:bg-amber-50 transition-colors cursor-pointer">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-900">
                    {pendingCount} pending verification{pendingCount !== 1 ? "s" : ""}
                  </h3>
                  <p className="text-xs text-amber-700 font-medium">
                    Employee requests waiting for your review
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-amber-600" />
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/admin/verifications">
            <Card className="shadow-none border border-slate-100 bg-white hover:border-slate-200 transition-colors cursor-pointer h-full">
              <CardContent className="p-5">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Verify Employees
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Review and approve employee verification requests.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/users">
            <Card className="shadow-none border border-slate-100 bg-white hover:border-slate-200 transition-colors cursor-pointer h-full">
              <CardContent className="p-5">
                <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Manage Users
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  View and manage organization employees.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/departments">
            <Card className="shadow-none border border-slate-100 bg-white hover:border-slate-200 transition-colors cursor-pointer h-full">
              <CardContent className="p-5">
                <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center mb-4">
                  <Building2 className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Departments
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Manage organization departments and job levels.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/documents">
            <Card className="shadow-none border border-slate-100 bg-white hover:border-slate-200 transition-colors cursor-pointer h-full">
              <CardContent className="p-5">
                <div className="h-10 w-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center mb-4">
                  <Upload className="h-5 w-5 text-orange-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Upload Documents
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Upload and manage organization documents.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/analytics">
            <Card className="shadow-none border border-slate-100 bg-white hover:border-slate-200 transition-colors cursor-pointer h-full">
              <CardContent className="p-5">
                <div className="h-10 w-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center mb-4">
                  <BarChart3 className="h-5 w-5 text-sky-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Analytics
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  View organization performance and usage stats.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
