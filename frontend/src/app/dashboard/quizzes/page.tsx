"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FullPageSpinner } from "@/components/loading";
import {
  Search,
  History,
  LayoutGrid,
  TrendingUp,
  Target,
  Trophy,
  Sparkles,
  ChevronLeft,
  BookOpen,
  Map,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { GKQuiz } from "@/types/database";
import { TopicFolderCard } from "@/components/quiz/TopicFolderCard";
import { GKQuizCard } from "@/components/quiz/GKQuizCard";
import { CustomChallengeDialog } from "@/components/quiz/CustomChallengeDialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const topicMetadata: Record<string, { icon: any; color: string; gradient: string; tint: string; darkTint: string }> = {
  "Nepal Constitution": {
    icon: BookOpen,
    color: "text-indigo-600 dark:text-indigo-400",
    gradient: "from-indigo-600 to-indigo-900",
    tint: "bg-indigo-50",
    darkTint: "bg-indigo-950/30",
  },
  "Geography": {
    icon: Map,
    color: "text-emerald-600 dark:text-emerald-400",
    gradient: "from-emerald-600 to-emerald-900",
    tint: "bg-emerald-50",
    darkTint: "bg-emerald-950/30",
  },
  "History": {
    icon: History,
    color: "text-amber-600 dark:text-amber-400",
    gradient: "from-amber-600 to-amber-900",
    tint: "bg-amber-50",
    darkTint: "bg-amber-950/30",
  },
  "Current Affairs": {
    icon: Sparkles,
    color: "text-violet-600 dark:text-violet-400",
    gradient: "from-violet-600 to-violet-900",
    tint: "bg-violet-50",
    darkTint: "bg-violet-950/30",
  },
  "General Knowledge": {
    icon: Layers,
    color: "text-slate-600 dark:text-slate-400",
    gradient: "from-slate-700 to-slate-900",
    tint: "bg-slate-50",
    darkTint: "bg-slate-900/50",
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function QuizzesPage() {
  const { isLoading: authLoading } = useAuth();
  const [quizzes, setQuizzes] = useState<GKQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  
  // Real-time Analytics State
  const [stats, setStats] = useState<{
    mastery: number;
    streak: number;
    categories?: Record<string, number>;
    subCategories?: Record<string, number>;
    rank: { label: string; percentile: number; totalSolved: number };
  } | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [quizRes, statsRes] = await Promise.all([
          fetch("/api/gk/quizzes"),
          fetch("/api/gk/analytics/summary")
        ]);
        
        if (quizRes.ok) setQuizzes(await quizRes.json());
        if (statsRes.ok) setStats(await statsRes.json());
      } catch (e) {
        console.error("Failed to fetch dashboard data", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Hierarchical Data Grouping
  const groupedData = useMemo(() => {
    const groups: Record<string, Record<string, GKQuiz[]>> = {};
    
    quizzes.forEach((q) => {
      if (!groups[q.category]) groups[q.category] = {};
      const sub = q.sub_category || "General";
      if (!groups[q.category][sub]) groups[q.category][sub] = [];
      groups[q.category][sub].push(q);
    });

    return groups;
  }, [quizzes]);

  const topics = useMemo(() => Object.keys(groupedData), [groupedData]);

  // Filtering for Search
  const filteredQuizzes = useMemo(() => {
    if (!search.trim()) return quizzes;
    return quizzes.filter(q => 
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.category.toLowerCase().includes(search.toLowerCase()) ||
      (q.sub_category && q.sub_category.toLowerCase().includes(search.toLowerCase()))
    );
  }, [quizzes, search]);

  if (authLoading || (loading && quizzes.length === 0)) return <FullPageSpinner />;

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-[1400px] mx-auto pb-20">
      <AnimatePresence mode="wait">
        {!selectedTopic ? (
          /* LIBRARY GRID VIEW */
          <motion.div 
            key="library"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-8"
          >
            {/* 1. Snapshot Analytics Bar */}
            {!search && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Mastery Snapshot Card */}
                  <Card className="border-none shadow-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white overflow-hidden relative group">
                      <div className="absolute -right-6 -top-10 opacity-20 dark:opacity-10 transform group-hover:scale-110 transition-transform duration-500">
                          <Target className="w-40 h-40" />
                      </div>
                      <CardContent className="p-6 relative z-10 flex items-center h-full">
                          <div className="space-y-2">
                              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Overall Mastery</p>
                              <div className="flex items-baseline gap-1">
                                  <h2 className="text-5xl font-bold tracking-tighter">{stats?.mastery ?? "--"}</h2>
                                  <span className="text-xl font-bold text-indigo-300">%</span>
                              </div>
                              <p className="text-xs font-medium text-indigo-100 mt-2">
                                Your average accuracy across all attempts.
                              </p>
                          </div>
                      </CardContent>
                  </Card>

                  {/* Streak Card */}
                  <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg dark:hover:shadow-indigo-500/10 transition-all">
                      <CardContent className="p-6 flex items-center gap-5">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 transition-transform group-hover:scale-110 group-hover:-rotate-3">
                              <TrendingUp className="h-6 w-6" />
                          </div>
                          <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Current Streak</p>
                              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats?.streak ?? "--"} Days</h3>
                          </div>
                      </CardContent>
                  </Card>

                  {/* Rank Card */}
                  <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg dark:hover:shadow-indigo-500/10 transition-all">
                      <CardContent className="p-6 flex items-center gap-5">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 transition-transform group-hover:scale-110 group-hover:-rotate-3">
                              <Trophy className="h-6 w-6" />
                          </div>
                          <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Academy Rank</p>
                              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Top {stats?.rank.percentile ?? "--"}%</h3>
                          </div>
                      </CardContent>
                  </Card>
              </div>
            )}

            {/* 2. Page Header / Breadcrumbs */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 text-sm font-bold">
                    L
                  </div>
                  <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">LokAI Learning Library</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      <span className="text-indigo-600 dark:text-indigo-400">Base Library</span>
                      <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                      <span className="text-slate-900 dark:text-slate-100">Subject Discovery</span>
                  </div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                    Skill Academy subjects
                  </h1>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors" />
                    <Input
                      placeholder="Search subjects or topics..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 h-11 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-slate-900/5 dark:focus:ring-slate-100/5 shadow-none text-sm font-medium w-full md:w-64 text-slate-900 dark:text-slate-100"
                    />
                </div>
                
                <CustomChallengeDialog 
                  defaultCategory={search || "All"} 
                  availableCategories={Object.keys(groupedData)}
                  availableSubCategories={search && groupedData[search] ? Object.keys(groupedData[search]) : []}
                >
                  <Button variant="outline" className="h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold text-slate-700 dark:text-slate-300 gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-none transition-all px-5">
                      <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      Personalized Practice
                  </Button>
                </CustomChallengeDialog>

                <Link href="/dashboard/quizzes/history">
                    <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-none">
                      <History className="h-5 w-5 text-slate-600" />
                    </Button>
                </Link>
              </div>
            </div>

            {/* 3. Grid Views */}
            <AnimatePresence mode="wait">
              {search.trim() ? (
                /* SEARCH VIEW */
                <motion.div 
                  key="search-results"
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  className="grid gap-6 md:grid-cols-2 lg:grid-cols-2"
                >
                  {filteredQuizzes.length > 0 ? (
                    filteredQuizzes.map((q) => (
                        <motion.div key={q.id} variants={itemVariants}>
                          <GKQuizCard quiz={q} />
                        </motion.div>
                    ))
                  ) : (
                      <div className="col-span-full py-20 flex flex-col items-center text-center space-y-6 max-w-sm mx-auto">
                        <div className="w-16 h-16 rounded-[1.25rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                            <LayoutGrid className="h-8 w-8" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No matching subjects</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                              We couldn't find "<span className="text-slate-900 dark:text-slate-100 font-bold">{search}</span>" in the library. 
                              Start a personalized practice session on this topic.
                            </p>
                        </div>
                        <CustomChallengeDialog defaultCategory={search}>
                            <Button className="h-11 px-8 rounded-xl bg-slate-900 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200 text-white font-bold hover:bg-slate-800 shadow-none gap-2">
                              <Sparkles className="h-4 w-4" />
                              Build Custom Practice
                            </Button>
                        </CustomChallengeDialog>
                      </div>
                  )}
                </motion.div>
              ) : (
                /* TOPICS LIST */
                <motion.div 
                  key="topics"
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                >
                  {topics.map((topic, i) => (
                    <motion.div key={topic} variants={itemVariants}>
                        <TopicFolderCard
                          index={i}
                          topic={topic}
                          chapters={Object.keys(groupedData[topic]).length}
                          count={Object.values(groupedData[topic]).flat().length}
                          onClick={() => setSelectedTopic(topic)}
                          mastery={stats?.categories?.[topic] || 0}
                        />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* 4. PREMIUM FULL-PAGE SUBJECT VIEW (Restored Initial Style) */
          <motion.div 
            key="subject-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {/* Header / Breadcrumb */}
            <div className="flex items-center justify-between gap-6 border-b border-slate-100 pb-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <button 
                     onClick={() => setSelectedTopic(null)}
                     className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm"
                   >
                     <ChevronLeft className="h-5 w-5" />
                   </button>
                   <div className="space-y-1">
                      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                         <button onClick={() => setSelectedTopic(null)} className="hover:text-indigo-600">Base Academy</button>
                         <div className="h-1 w-1 rounded-full bg-slate-300" />
                         <span className="text-slate-900 dark:text-slate-100">{selectedTopic}</span>
                      </div>
                      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                        Subject curriculum explorer
                      </h1>
                   </div>
                </div>
              </div>

              <div className="hidden md:flex gap-3">
                 <CustomChallengeDialog 
                   defaultCategory={selectedTopic}
                   availableCategories={Object.keys(groupedData)}
                   availableSubCategories={Object.keys(groupedData[selectedTopic] || {})}
                 >
                   <Button className="h-11 px-6 rounded-xl bg-slate-900 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200 text-white font-bold hover:bg-slate-800 shadow-none gap-2">
                       <Sparkles className="h-4 w-4" />
                       Personalized {selectedTopic} Practice
                   </Button>
                 </CustomChallengeDialog>
              </div>
            </div>

            {/* Colorful Subject Banner */}
            {(() => {
                const meta = topicMetadata[selectedTopic] || topicMetadata["General Knowledge"];
                const SubjectIcon = meta.icon;
                const mastery = stats?.categories?.[selectedTopic] || 0;
                const bannerImage = {
                  "Nepal Constitution": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=1400",
                  "Geography": "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1400",
                  "History": "https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&q=80&w=1400",
                  "Current Affairs": "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1400",
                }[selectedTopic] || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1400";
                
                return (
                  <div className={`relative rounded-[2rem] p-6 sm:p-8 overflow-hidden bg-slate-900 text-white group`}>
                     {/* Immersive Background Image */}
                     <div className="absolute inset-0 opacity-40 group-hover:opacity-50 transition-opacity duration-700">
                        <img 
                          src={bannerImage} 
                          alt="" 
                          className="h-full w-full object-cover transform scale-105 group-hover:scale-100 transition-transform duration-1000" 
                        />
                        <div className={`absolute inset-0 bg-gradient-to-br ${meta.gradient} mix-blend-multiply opacity-60`} />
                     </div>
                     
                     <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-12">
                        <div className="space-y-6 max-w-lg">
                           <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                              <SubjectIcon className="h-7 w-7 text-white" />
                           </div>
                           <div className="space-y-2">
                              <h2 className="text-5xl font-bold tracking-tighter drop-shadow-sm">{selectedTopic}</h2>
                              <p className="text-lg font-medium text-white/80 drop-shadow-sm">
                                Explore the comprehensive modules and practice drills for {selectedTopic}. Track your performance per chapter.
                              </p>
                           </div>
                        </div>

                        <div className="w-full md:w-80 space-y-4">
                           <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/80">
                              <span>Subject Readiness</span>
                              <span>{mastery}% Progress</span>
                           </div>
                           <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${mastery}%` }}
                                className="h-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.5)]" 
                              />
                           </div>
                           <div className="flex items-center justify-between text-white/80">
                              <span className="text-xs font-bold leading-none">{Object.keys(groupedData[selectedTopic] || {}).length} Chapters</span>
                              <span className="text-xs font-bold leading-none">{Object.values(groupedData[selectedTopic] || {}).flat().length} Modules</span>
                           </div>
                        </div>
                     </div>
                  </div>
                );
            })()}

            {/* Full-Page Chapter Grid */}
            <div className="grid gap-4">
               <Accordion type="multiple" defaultValue={Object.keys(groupedData[selectedTopic] || {})} className="space-y-4">
                  {Object.entries(groupedData[selectedTopic] || {}).map(([sub, items], idx) => {
                      const chapterMastery = stats?.subCategories?.[`${selectedTopic}::${sub}`] || 0;
                      const colorClass = chapterMastery >= 80 ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900" 
                                      : chapterMastery >= 60 ? "text-amber-500 bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900" 
                                      : chapterMastery > 0 ? "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900"
                                      : "text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700";
                      
                      return (
                        <AccordionItem 
                          key={sub} 
                          value={sub} 
                          className="border border-slate-200 dark:border-slate-800 rounded-[2rem] bg-white dark:bg-slate-900 px-8 shadow-sm overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all"
                        >
                           <AccordionTrigger className="hover:no-underline py-6">
                              <div className="flex items-center gap-6 text-left">
                                 <div className={`flex h-14 w-14 items-center justify-center rounded-2xl font-bold text-xl border transition-transform group-hover:scale-110 ${colorClass}`}>
                                    {String(idx + 1).padStart(2, '0')}
                                 </div>
                                 <div className="space-y-1">
                                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">{sub}</p>
                                    <div className="flex items-center gap-4">
                                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">{items.length} Modules</p>
                                       <div className="h-1 w-1 rounded-full bg-slate-200" />
                                       <div className="flex items-center gap-1.5">
                                          <div className={`h-1.5 w-1.5 rounded-full ${chapterMastery >= 80 ? 'bg-emerald-500' : chapterMastery >= 60 ? 'bg-amber-500' : 'bg-slate-300'}`} />
                                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                             {chapterMastery > 0 ? `${chapterMastery}% Readiness` : "Not Started"}
                                          </span>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           </AccordionTrigger>
                           <AccordionContent className="pb-6">
                              <div className="grid gap-4 pt-4 md:grid-cols-2 border-t border-slate-50 mt-2 pt-6">
                                 {items.map((q) => (
                                    <GKQuizCard key={q.id} quiz={q} />
                                 ))}
                              </div>
                           </AccordionContent>
                        </AccordionItem>
                      );
                  })}
               </Accordion>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
