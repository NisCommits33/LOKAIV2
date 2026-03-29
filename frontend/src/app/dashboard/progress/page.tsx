"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FullPageSpinner } from "@/components/loading";
import { BackButton } from "@/components/ui/back-button";
import { 
  Brain, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  BookOpen, 
  CheckCircle2, 
  ChevronRight, 
  FileText,
  Award
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Cell 
} from "recharts";

const container = {
  hidden: { opacity: 0 },
  show: { scale: 1, opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
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
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/users/analytics");
        if (res.ok) {
          const d = await res.json();
          setData(d);
        }
      } catch (e) {
        console.error("Failed to load analytics", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (authLoading || loading) return <FullPageSpinner />;
  if (!dbUser || !data) return (
       <div className="p-8 text-center text-red-500 font-bold">Failed to load progress data.</div>
  );

  const getScoreColor = (score: number) => {
      if (score >= 80) return "text-emerald-500";
      if (score >= 60) return "text-amber-500";
      return "text-red-500";
  };
  
  const getScoreBg = (score: number) => {
      if (score >= 80) return "bg-emerald-50 text-emerald-700 border-emerald-200";
      if (score >= 60) return "bg-amber-50 text-amber-700 border-amber-200";
      return "bg-red-50 text-red-700 border-red-200";
  };

  // Prepare chart data: capping max items to 8 for neatness
  const chartData = data.progress_by_category.slice(0, 8).map(d => ({
      name: d.category.replace(/_/g, ' '),
      Accuracy: d.accuracy,
      Questions: d.total_questions,
  }));

  const isBrandNewUser = data.total_quizzes_taken === 0;

  return (
    <div className="p-4 sm:p-8 max-w-[1400px] mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
             <div className="mt-1"><BackButton /></div>
             <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
               My Learning Progress
             </h1>
          </div>
          <p className="text-slate-500 font-medium ml-12 mt-1">
             Track your readiness, accuracy, and identify areas for improvement.
          </p>
        </div>
      </div>

      {isBrandNewUser ? (
         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center max-w-2xl mx-auto mt-12">
            <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="h-10 w-10 text-indigo-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">No Progress Yet</h2>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto">Start taking quizzes in the Learning Library or upload your personal documents to generate performance analytics.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard/org-documents">
                    <Button className="bg-indigo-600 hover:bg-indigo-700 h-12 px-8 rounded-xl font-bold w-full sm:w-auto shadow-md shadow-indigo-100">Browse Learning Library</Button>
                </Link>
                <Link href="/dashboard/documents">
                    <Button variant="outline" className="h-12 px-8 rounded-xl font-bold border-slate-200 w-full sm:w-auto">Upload Personal Doc</Button>
                </Link>
            </div>
         </motion.div>
      ) : (
         <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div variants={item}>
                    <Card className="border-none shadow-xl bg-white overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-50 to-transparent rounded-bl-full -z-0 opacity-50 transition-transform group-hover:scale-110" />
                        <CardContent className="p-8 relative z-10 flex flex-col items-center text-center">
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Readiness Score</p>
                            <div className="relative w-32 h-32 flex items-center justify-center mb-2">
                                {/* Simple CSS radial progress ring */}
                                <svg className="w-full h-full transform -rotate-90">
                                   <circle cx="64" cy="64" r="56" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                                   <circle 
                                      cx="64" cy="64" r="56" fill="transparent" 
                                      stroke={data.readiness_score >= 80 ? "#10b981" : data.readiness_score >= 60 ? "#f59e0b" : "#ef4444"} 
                                      strokeWidth="12" 
                                      strokeLinecap="round"
                                      strokeDasharray={`${2 * Math.PI * 56}`}
                                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - data.readiness_score / 100)}`}
                                      className="transition-all duration-1000 ease-out"
                                   />
                                </svg>
                                <div className="absolute flex flex-col items-center">
                                    <span className={`text-4xl font-black tracking-tighter ${getScoreColor(data.readiness_score)}`}>{data.readiness_score}%</span>
                                </div>
                            </div>
                            <p className="text-sm font-bold text-slate-700 mt-2">
                                {data.readiness_score >= 80 ? "Excellent standing" : data.readiness_score >= 60 ? "On the right track" : "Needs significant review"}
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={item} className="flex flex-col gap-6">
                    <Card className="border-none shadow-md bg-white flex-1">
                        <CardContent className="p-6 flex items-center justify-between h-full">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Attempts</p>
                                <h3 className="text-4xl font-black text-slate-900 tracking-tight">{data.total_quizzes_taken}</h3>
                            </div>
                            <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
                                <TrendingUp className="h-7 w-7 text-indigo-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-md bg-white flex-1">
                        <CardContent className="p-6 flex items-center justify-between h-full">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Subjects Tracked</p>
                                <h3 className="text-4xl font-black text-slate-900 tracking-tight">{data.progress_by_category.length}</h3>
                            </div>
                            <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
                                <BookOpen className="h-7 w-7 text-emerald-500" />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={item}>
                    <Card className="border-none shadow-xl bg-white h-full overflow-hidden flex flex-col">
                        <div className="bg-slate-900 p-4 border-b border-slate-800">
                             <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
                                <Award className="h-3.5 w-3.5 text-yellow-400" /> Best Performance
                             </h3>
                        </div>
                        <CardContent className="p-6 flex-1 flex flex-col">
                            {data.strong_areas.length > 0 ? (
                                <div className="space-y-4 flex-1">
                                    {data.strong_areas.slice(0, 3).map((area, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-emerald-50">
                                            <div className="flex items-center gap-3">
                                                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                                                <span className="font-bold text-sm text-emerald-900 line-clamp-1">{area.category.replace(/_/g, ' ')}</span>
                                            </div>
                                            <span className="font-black text-emerald-700">{area.accuracy}%</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center py-6">
                                    <Target className="h-10 w-10 text-slate-200 mb-3" />
                                    <p className="text-sm font-medium text-slate-400 text-center max-w-[200px]">Score over 80% on subjects to unlock Strong Areas.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Charts & Recommendations Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <motion.div variants={item} className="lg:col-span-8">
                    <Card className="border-none shadow-xl bg-white h-[450px] flex flex-col">
                        <CardHeader className="pb-2 border-b border-slate-50">
                            <CardTitle className="text-base font-bold text-slate-900">Accuracy by Subject</CardTitle>
                            <CardDescription className="text-xs">Your performance across various document categories</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 flex-1 mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                                        dy={10}
                                        angle={-35}
                                        textAnchor="end"
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                                        dx={-10}
                                        domain={[0, 100]}
                                        tickFormatter={(val) => `${val}%`}
                                    />
                                    <Tooltip 
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', fontWeight: 'bold', fontSize: '12px' }}
                                    />
                                    <Bar dataKey="Accuracy" radius={[6, 6, 0, 0]} maxBarSize={40}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.Accuracy >= 80 ? '#10b981' : entry.Accuracy >= 60 ? '#6366f1' : '#f43f5e'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={item} className="lg:col-span-4 flex flex-col gap-8">
                    <Card className="border-none shadow-xl bg-white overflow-hidden">
                        <div className="bg-red-50 p-4 border-b border-red-100 flex items-center justify-between">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-red-600 flex items-center gap-2">
                                <AlertTriangle className="h-3.5 w-3.5" /> Needs Attention
                            </h3>
                            <span className="text-[10px] font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded-full">{data.weak_areas.length}</span>
                        </div>
                        <CardContent className="p-0">
                            {data.weak_areas.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {data.weak_areas.slice(0, 3).map((area, idx) => (
                                        <div key={idx} className="p-4 hover:bg-slate-50 transition-colors">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-bold text-sm text-slate-800 line-clamp-1 flex-1 pr-4">{area.category.replace(/_/g, ' ')}</span>
                                                <span className="font-black text-red-500 text-sm">{area.accuracy}%</span>
                                            </div>
                                            <Progress value={area.accuracy} className="h-1.5 [&>div]:bg-red-500 bg-red-100" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center bg-white">
                                    <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
                                    <p className="text-sm font-medium text-slate-500">No weak areas identified. Great job!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl bg-white flex-1 flex flex-col">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Brain className="h-4 w-4 text-indigo-500" /> Suggested Action Plan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 flex-1 flex flex-col">
                            {data.recommendations.length > 0 ? (
                                <div className="space-y-3 flex-1">
                                    {data.recommendations.map((rec) => (
                                        <Link key={rec.id} href={`/dashboard/org-documents/${rec.id}`} className="block group">
                                            <div className="bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 p-3 rounded-xl transition-all h-full flex items-center justify-between">
                                                <div className="pr-4">
                                                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 line-clamp-1 mb-1">{rec.title}</h4>
                                                    <p className="text-[10px] text-slate-500 line-clamp-1">{rec.description || `Study material for ${rec.policy_tag}`}</p>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 shrink-0" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center p-6 text-center">
                                     <p className="text-xs text-slate-400 font-medium">No particular recommendations right now.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
         </motion.div>
      )}
    </div>
  );
}
