/**
 * dashboard/page.tsx — Main Dashboard
 *
 * The primary authenticated landing page showing:
 * - Personalized welcome message with the user's first name
 * - Quick Analytics (Readiness Score, Weak Areas, Recommendations)
 * - Feature card grid linking to GK Quizzes, Documents, and Progress
 *
 * @module app/dashboard
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FullPageSpinner } from "@/components/loading";
import { BookOpen, FileText, TrendingUp, Target, AlertTriangle, ArrowRight, Layers, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

interface AnalyticsData {
  readiness_score: number;
  total_quizzes_taken: number;
  weak_areas: Array<{ category: string; accuracy: number; total_questions: number }>;
  strong_areas: Array<{ category: string; accuracy: number; total_questions: number }>;
  progress_by_category: Array<{ category: string; accuracy: number; total_questions: number }>;
  recommendations: Array<{ id: string; title: string; description: string | null; policy_tag: string | null }>;
}

export default function DashboardPage() {
  const { dbUser, isLoading: authLoading } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [mockTests, setMockTests] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (dbUser) {
      fetch("/api/users/analytics")
        .then(res => res.json())
        .then(data => setAnalytics(data))
        .catch(() => {});

      if (dbUser.role === "employee" || dbUser.role === "org_admin") {
        fetch("/api/users/mock-tests")
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              setMockTests(data);
            } else {
              setMockTests([]);
            }
          })
          .catch(() => setMockTests([]))
          .finally(() => setLoadingStats(false));
      } else {
        setLoadingStats(false);
      }
    }
  }, [dbUser]);

  const pendingMockTests = Array.isArray(mockTests) 
    ? mockTests.filter(t => !t.quiz_attempts || t.quiz_attempts.length === 0)
    : [];

  if (authLoading) return <FullPageSpinner />;

  const features = [
    {
      title: "Shared Learning",
      description: "Browse authoritative documents and guidelines mapped to your department.",
      icon: Layers,
      href: "/dashboard/org-documents",
      color: "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400",
      show: dbUser?.role === "employee" || dbUser?.role === "org_admin",
    },
    {
      title: "Detailed Progress",
      description: "Track your performance, identify weak areas, and view detailed charts.",
      icon: TrendingUp,
      href: "/dashboard/progress",
      color: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400",
      show: dbUser?.role === "employee" || dbUser?.role === "org_admin",
    },
    {
      title: "GK Quizzes",
      description: "Practice with general knowledge quizzes covering standard subjects.",
      icon: BookOpen,
      href: "/dashboard/quizzes",
      color: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400",
      show: true,
    },
    {
      title: "My Documents",
      description: "Upload personal study materials securely for private AI question generation.",
      icon: FileText,
      href: "/dashboard/documents",
      color: "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400",
      show: true,
    },
  ];

  const hasStats = !loadingStats && analytics && analytics.total_quizzes_taken > 0;

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-[1400px] mx-auto pb-12 bg-white dark:bg-slate-950 min-h-full">
      {/* Welcome section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            Welcome, {dbUser?.full_name?.split(" ")[0] || "Scholar"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium pb-2">
            Continue your government exam preparation journey with AI-driven insights.
          </p>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="capitalize bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-none font-bold text-[10px] uppercase tracking-widest px-2.5 py-0.5">
              {dbUser?.role?.replace("_", " ") || "Public"}
            </Badge>
            {dbUser?.verification_status === "verified" && (
              <Badge className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-none font-bold text-[10px] uppercase tracking-widest px-2.5 py-0.5 shadow-sm">
                Verified Employee
              </Badge>
            )}
            {dbUser?.department_id && (
              <Badge variant="outline" className="text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/30 font-bold text-[10px] uppercase tracking-widest px-2.5 py-0.5 shadow-sm">
                Dept {dbUser.department_id.split('-')[0]}
              </Badge>
            )}
          </div>
        </div>
      </motion.div>

      {/* Mock Test Alert */}
      {pendingMockTests.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-orange-500 to-rose-600 rounded-2xl p-6 text-white shadow-xl shadow-orange-200 dark:shadow-none relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <ClipboardCheck className="w-32 h-32" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Badge className="bg-white/20 text-white border-none text-[10px] font-black uppercase tracking-widest">Priority</Badge>
                <div className="flex h-2 w-2 rounded-full bg-white animate-pulse" />
              </div>
              <h2 className="text-2xl font-black tracking-tight leading-none">Mandatory Mock Test Assigned</h2>
              <p className="text-orange-50/80 font-medium text-sm max-w-md">
                Your organization has pushed an official assessment: <span className="text-white font-bold">{pendingMockTests[0].title}</span>. Please complete it before the deadline.
              </p>
            </div>
            <Link href="/dashboard/mock-tests" className="w-full md:w-auto">
              <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 w-full font-bold h-14 rounded-xl shadow-lg">
                View & Take Test
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </motion.div>
      )}

      {/* Snapshot Analytics Bar */}
      {loadingStats ? (
          <div className="h-40 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 animate-pulse" />
      ) : hasStats ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Readiness Score Card */}
                 <Card className="border-none shadow-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white overflow-hidden relative group">
                     <div className="absolute -right-6 -top-10 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
                         <Target className="w-40 h-40" />
                     </div>
                     <CardContent className="p-6 relative z-10 flex items-center justify-between h-full">
                         <div className="space-y-2">
                             <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Overall Readiness</p>
                             <div className="flex items-baseline gap-1">
                                 <h2 className="text-5xl font-black tracking-tighter">{analytics.readiness_score}</h2>
                                 <span className="text-xl font-bold text-indigo-300">%</span>
                             </div>
                             <p className="text-xs font-medium text-indigo-100 mt-2 max-w-[200px]">
                                {analytics.readiness_score >= 80 ? "You're exceptionally prepared." 
                                 : analytics.readiness_score >= 60 ? "You're making solid progress." 
                                 : "You need more review in key areas."}
                             </p>
                         </div>
                     </CardContent>
                 </Card>

                 {/* Needs Attention / Weak Areas */}
                 <Card className="border-none shadow-xl bg-white dark:bg-slate-900 lg:col-span-2">
                     <CardContent className="p-6 h-full flex flex-col justify-center">
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-2">
                             <TrendingUp className="h-3.5 w-3.5 text-indigo-500" /> Recent Learning Activity
                         </p>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                             <div className="space-y-4">
                                 {analytics.weak_areas.slice(0, 1).map((area: { category: string, accuracy: number }, idx: number) => (
                                     <div key={idx} className="bg-red-50 dark:bg-red-950/20 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                                         <div className="flex items-center justify-between mb-1">
                                             <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-sm">
                                                 <AlertTriangle className="h-4 w-4" /> Priority Review
                                             </div>
                                             <span className="text-xs font-black text-red-500 dark:text-red-400">{area.accuracy}%</span>
                                         </div>
                                         <p className="text-xs text-red-600 dark:text-red-300 font-medium">Topic: {area.category.replace(/_/g, ' ')}</p>
                                     </div>
                                 ))}
                                 {analytics.weak_areas.length === 0 && (
                                     <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                                         <p className="text-sm font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2 mb-1">
                                             All Good!
                                         </p>
                                         <p className="text-xs text-emerald-600 dark:text-emerald-300 font-medium">You have no major weak areas right now.</p>
                                     </div>
                                 )}
                             </div>
                             
                             <div className="space-y-3 hidden sm:block">
                                 <p className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1 mb-2">Continue where you left off:</p>
                                 {analytics.recommendations.slice(0, 2).map((rec: { id: string, title: string }) => (
                                     <Link key={rec.id} href={`/dashboard/org-documents/${rec.id}`}>
                                        <div className="group flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors border-b border-transparent hover:border-slate-100 dark:hover:border-slate-700 cursor-pointer">
                                           <div className="flex items-center gap-3">
                                               <FileText className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0 group-hover:text-indigo-500 dark:group-hover:text-indigo-400" />
                                               <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-200 line-clamp-1">{rec.title}</span>
                                           </div>
                                           <ArrowRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity transform -translate-x-2 group-hover:translate-x-0" />
                                        </div>
                                     </Link>
                                 ))}
                             </div>
                         </div>
                     </CardContent>
                 </Card>
             </div>
          </motion.div>
      ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-indigo-50/50 dark:bg-indigo-950/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
             <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                 <div>
                     <h2 className="text-lg font-bold text-indigo-900 dark:text-indigo-100 tracking-tight flex items-center gap-2 mb-1">
                        Get Started with LokAI <Target className="h-5 w-5 text-indigo-500 hidden sm:block" />
                     </h2>
                     <p className="text-sm text-indigo-700/80 dark:text-indigo-300/80 font-medium max-w-xl">
                        Your readiness scores and weak area tracking will appear here once you take a few quizzes. 
                        Head to the Learning Library to read authoritative materials and generate your first practice quiz.
                     </p>
                 </div>
                 <Link href="/dashboard/org-documents" className="shrink-0">
                     <div className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white shadow-xl shadow-indigo-200/50 dark:shadow-none px-6 py-3 rounded-xl font-bold text-sm transition-transform active:scale-95 flex items-center justify-center h-12">
                         Browse Learning Library
                     </div>
                 </Link>
             </div>
          </motion.div>
      )}

      {/* Feature Navigation Cards */}
      <div className="space-y-4 pt-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Quick Navigation</h3>
          <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.filter((f) => f.show).map((feature, i) => (
                <motion.div key={i} variants={item}>
                  <Link href={feature.href}>
                    <Card className="shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg dark:hover:shadow-indigo-500/10 transition-all cursor-pointer group h-full">
                      <CardContent className="p-6 space-y-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${feature.color} transition-transform group-hover:scale-110 group-hover:-rotate-3`}>
                            <feature.icon className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {feature.title}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                            {feature.description}
                            </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
          </motion.div>
      </div>
    </div>
  );
}
