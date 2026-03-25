/**
 * super-admin/page.tsx — Platform Overview Dashboard
 *
 * Shows platform-wide statistics and quick navigation for the super admin:
 * - Total organizations, pending applications, active users
 * - Quick action links to organization management
 *
 * @module app/super-admin
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Shield,
} from "lucide-react";

interface PlatformStats {
  totalOrganizations: number;
  totalUsers: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
}

export default function SuperAdminPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/super/stats");
        if (!res.ok) throw new Error("Failed to load stats");
        const data = await res.json();
        setStats({
          totalOrganizations: data.totalOrganizations ?? 0,
          totalUsers: data.totalUsers ?? 0,
          pendingApplications: data.pendingApplications ?? 0,
          approvedApplications: data.approvedApplications ?? 0,
          rejectedApplications: data.rejectedApplications ?? 0,
        });
      } catch {
        setStats({
          totalOrganizations: 0,
          totalUsers: 0,
          pendingApplications: 0,
          approvedApplications: 0,
          rejectedApplications: 0,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Organizations",
      value: stats?.totalOrganizations,
      icon: Building2,
      color: "text-blue-600 bg-blue-50",
    },
    {
      title: "Total Users",
      value: stats?.totalUsers,
      icon: Users,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      title: "Pending Applications",
      value: stats?.pendingApplications,
      icon: Clock,
      color: "text-amber-600 bg-amber-50",
    },
    {
      title: "Approved Applications",
      value: stats?.approvedApplications,
      icon: CheckCircle2,
      color: "text-green-600 bg-green-50",
    },
    {
      title: "Rejected Applications",
      value: stats?.rejectedApplications,
      icon: XCircle,
      color: "text-red-600 bg-red-50",
    },
  ];

  return (
    <div className="p-6 sm:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Platform Overview
          </h1>
          <p className="text-slate-500 font-medium">
            Monitor and manage the LokAI platform.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                {card.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${card.color}`}>
                <card.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold text-slate-900">
                  {card.value}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
              Organization Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-500">
              Review pending organization applications, approve or reject
              registrations, and assign organization admins.
            </p>
            {stats && stats.pendingApplications > 0 && (
              <Badge variant="secondary" className="bg-amber-50 text-amber-700">
                {stats.pendingApplications} pending review
              </Badge>
            )}
            <Button asChild className="w-full">
              <Link href="/super-admin/organizations">
                Manage Organizations
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-emerald-600" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-500">
              View all platform users, manage roles, and oversee verification
              statuses across organizations.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/super-admin/users">
                View All Users
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-slate-600" />
              Platform Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-500">
              Configure platform-wide settings, manage global defaults, and
              review system audit logs.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/super-admin/settings">
                Open Settings
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
