/**
 * super-admin/page.tsx — Platform Overview Dashboard
 *
 * Shows platform-wide statistics and quick navigation for the super admin:
 * - Total organizations, pending applications, active users, total documents, total quizzes
 * - Platform Growth Chart (Organizations over time)
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
  ArrowRight,
  Shield,
  FileText,
  BookOpen
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PlatformStats {
  totalOrganizations: number;
  totalUsers: number;
  totalDocuments: number;
  totalQuizzes: number;
}

export default function SuperAdminPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [growthData, setGrowthData] = useState<{ name: string; total: number }[]>([]);
  const [pendingApps, setPendingApps] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch base stats from stats API for backwards compatibility on pending apps
        const legacyRes = await fetch("/api/super/stats");
        if (legacyRes.ok) {
           const legacyData = await legacyRes.json();
           setPendingApps(legacyData.pendingApplications || 0);
        }

        // Fetch new comprehensive analytics
        const res = await fetch("/api/super/analytics");
        if (!res.ok) throw new Error("Failed to load analytics");
        const data = await res.json();
        
        setStats(data.metrics);
        setGrowthData(data.growthData || []);

      } catch (e) {
        console.error("Failed fetching stats", e);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Organizations",
      value: stats?.totalOrganizations || 0,
      icon: Building2,
      color: "text-blue-600 bg-blue-50",
    },
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      title: "Org Documents",
      value: stats?.totalDocuments || 0,
      icon: FileText,
      color: "text-purple-600 bg-purple-50",
    },
    {
      title: "GK Quizzes",
      value: stats?.totalQuizzes || 0,
      icon: BookOpen,
      color: "text-indigo-600 bg-indigo-50",
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Analytics Chart */}
      <Card className="col-span-full">
         <CardHeader>
            <CardTitle>Platform Growth (Organizations)</CardTitle>
         </CardHeader>
         <CardContent>
             {loading ? (
                 <Skeleton className="h-[300px] w-full" />
             ) : (
                 <div className="h-[300px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                         <LineChart data={growthData}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} />
                             <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={10} />
                             <YAxis axisLine={false} tickLine={false} tickMargin={10} />
                             <Tooltip />
                             <Line 
                                type="monotone" 
                                dataKey="total" 
                                stroke="#2563eb" 
                                strokeWidth={3}
                                dot={{ fill: '#2563eb', r: 4 }}
                                activeDot={{ r: 6 }} 
                             />
                         </LineChart>
                     </ResponsiveContainer>
                 </div>
             )}
         </CardContent>
      </Card>

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
            {pendingApps > 0 && (
              <Badge variant="secondary" className="bg-amber-50 text-amber-700">
                {pendingApps} pending review
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
              <BookOpen className="h-5 w-5 text-indigo-600" />
              Global Quizzes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-500">
              Create and push General Knowledge Quizzes straight to all normal 
              users platform-wide.
            </p>
            <Button asChild variant="outline" className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50">
              <Link href="/super-admin/quizzes">
                Quiz Manager
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
