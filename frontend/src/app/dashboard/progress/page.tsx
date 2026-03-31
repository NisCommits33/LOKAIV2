"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FullPageSpinner } from "@/components/loading";
import { BackButton } from "@/components/ui/back-button";
import { 
  Target, 
  TrendingUp, 
  BookOpen, 
  LayoutGrid
} from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { NarrativeInsights } from "@/components/analytics/narrative-insights";
import { BenchmarkingCard } from "@/components/analytics/benchmarking-card";
import { TrendForecastChart } from "@/components/analytics/trend-forecast-chart";
import { ExportControls } from "@/components/analytics/export-controls";

const container: Variants = {
  hidden: { opacity: 0 },
  show: { scale: 1, opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

interface AnalyticsData {
  readiness_score: number;
  total_quizzes_taken: number;
  weak_areas: Array<{ category: string; accuracy: number; total_questions: number }>;
  strong_areas: Array<{ category: string; accuracy: number; total_questions: number }>;
  progress_by_category: Array<{ category: string; accuracy: number; total_questions: number }>;
  recommendations: Array<{ id: string; title: string; description: string | null; policy_tag: string | null }>;
}

export default function ProgressDashboard() {
  const { dbUser, isLoading: authLoading } = useAuth();
  const [baseData, setBaseData] = useState<AnalyticsData | null>(null);
  const [trendData, setTrendData] = useState<any>(null);
  const [insightData, setInsightData] = useState<any>(null);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [resBase, resTrend, resInsight, resComparison] = await Promise.all([
          fetch("/api/users/analytics"),
          fetch("/api/users/analytics/performance-trend"),
          fetch("/api/users/analytics/insights"),
          fetch("/api/users/analytics/comparison")
        ]);

        if (resBase.ok) setBaseData(await resBase.json());
        if (resTrend.ok) setTrendData(await resTrend.json());
        if (resInsight.ok) setInsightData(await resInsight.json());
        if (resComparison.ok) setComparisonData(await resComparison.json());
      } catch (e) {
        console.error("Failed to load analytics", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (authLoading || loading) return <FullPageSpinner />;
  if (!dbUser || !baseData) return (
       <div className="p-8 text-center text-red-500 font-bold">Failed to load progress data.</div>
  );

  const isBrandNewUser = baseData.total_quizzes_taken === 0;

  // Prepare export bundle
  const exportBundle = {
      user: {
          full_name: dbUser.full_name || "User",
          email: dbUser.email || "",
          organization: (dbUser as any).organizations?.name || "Independent",
          department: (dbUser as any).departments?.name || "General"
      },
      analytics: baseData,
      history: trendData?.history || []
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen">
      <div className="p-4 sm:p-8 max-w-[1500px] mx-auto space-y-8 pb-24">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Analytics Suite</span>
            </div>
            <div>
              <div className="flex items-center gap-4">
                <div className="mt-1"><BackButton /></div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight italic">
                  Performance Hub
                </h1>
              </div>
              <p className="text-slate-500 font-medium ml-14 mt-1">
                Deep insights, predictive forecasting, and organizational benchmarking.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <ExportControls data={exportBundle} />
          </div>
        </div>

        {isBrandNewUser ? (
           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 p-20 text-center max-w-2xl mx-auto mt-12 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              <div className="bg-slate-50 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 transform group-hover:rotate-12 transition-transform duration-500">
                  <LayoutGrid className="h-12 w-12 text-indigo-500" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4 italic tracking-tight">Data Collection Pending</h2>
              <p className="text-slate-500 mb-10 max-w-sm mx-auto font-medium leading-relaxed">Our advanced analysis engine requires at least one completed quiz to build your learning persona and generate performance forecasts.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/dashboard/org-documents">
                      <Button className="bg-slate-900 hover:bg-slate-800 text-white h-14 px-10 rounded-2xl font-black uppercase tracking-widest w-full sm:w-auto shadow-lg">Start Learning</Button>
                  </Link>
              </div>
           </motion.div>
        ) : (
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Row 1: Narrative Insights & Benchmarking */}
              <div className="lg:col-span-8">
                 <NarrativeInsights data={insightData} loading={!insightData} />
              </div>
              <div className="lg:col-span-4">
                 <BenchmarkingCard data={comparisonData} loading={!comparisonData} />
              </div>

              {/* Row 2: Trend & Quick Stats */}
              <div className="lg:col-span-9">
                 <TrendForecastChart 
                    history={trendData?.history || []} 
                    forecast={trendData?.forecast || []}
                    stats={trendData?.stats || { trend: "stable", net_improvement: 0 }}
                    loading={!trendData}
                 />
              </div>

              <div className="lg:col-span-3 flex flex-col gap-6">
                  <Card className="border-none shadow-xl bg-white flex-1 relative overflow-hidden group">
                      <CardContent className="p-8 h-full flex flex-col justify-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Readiness Baseline</p>
                          <h3 className="text-5xl font-black text-slate-900 tracking-tighter italic">{baseData.readiness_score}%</h3>
                          <div className="mt-6 flex items-center gap-2">
                             <TrendingUp className="h-4 w-4 text-emerald-500" />
                             <span className="text-xs font-bold text-emerald-600">Current Standing</span>
                          </div>
                      </CardContent>
                  </Card>
                  
                  <Card className="border-none shadow-xl bg-indigo-600 flex-1 relative overflow-hidden group">
                      <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-white/10 rounded-full blur-2xl" />
                      <CardContent className="p-8 h-full flex flex-col justify-center text-white">
                          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-2">Knowledge Volume</p>
                          <h3 className="text-5xl font-black tracking-tighter italic">{baseData.total_quizzes_taken}</h3>
                          <div className="mt-6 flex items-center gap-2">
                             <BookOpen className="h-4 w-4 text-indigo-200" />
                             <span className="text-xs font-bold text-indigo-100 italic">Attempts Logged</span>
                          </div>
                      </CardContent>
                  </Card>
              </div>

              {/* Row 3: Focus Areas (Bottom Row) */}
              <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                 <Card className="border-none shadow-xl bg-white overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b border-slate-100">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900">Performance by Topic</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-6">
                           {baseData.progress_by_category.slice(0, 5).map((cat, idx) => (
                              <div key={idx} className="space-y-2">
                                 <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{cat.category.replace(/_/g, ' ')}</span>
                                    <span className="text-xs font-black text-slate-900">{cat.accuracy}%</span>
                                 </div>
                                 <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                     <motion.div 
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${cat.accuracy}%` }}
                                        transition={{ duration: 1 }}
                                        className={`h-full ${cat.accuracy >= 80 ? 'bg-emerald-500' : cat.accuracy >= 60 ? 'bg-indigo-500' : 'bg-red-500'}`}
                                     />
                                 </div>
                              </div>
                           ))}
                        </div>
                    </CardContent>
                 </Card>

                 <Card className="border-none shadow-xl bg-white overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b border-slate-100">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900">Priority Study Areas</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid gap-4">
                           {baseData.weak_areas.length > 0 ? (
                               baseData.weak_areas.slice(0, 4).map((area, idx) => (
                                   <div key={idx} className="flex items-center justify-between p-4 bg-red-50/50 border border-red-100 rounded-xl">
                                      <div className="flex items-center gap-3">
                                         <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                                            <Target className="h-4 w-4" />
                                         </div>
                                         <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">{area.category.replace(/_/g, ' ')}</span>
                                      </div>
                                      <span className="text-[10px] font-black text-red-600 bg-red-100 px-2.5 py-1 rounded-full">{area.accuracy}% Accuracy</span>
                                   </div>
                               ))
                           ) : (
                               <div className="py-12 text-center">
                                  <p className="text-slate-400 font-medium">No weak areas identified. You're balanced!</p>
                               </div>
                           )}
                        </div>
                    </CardContent>
                 </Card>
              </div>
           </div>
        )}
      </div>
    </div>
  );
}
