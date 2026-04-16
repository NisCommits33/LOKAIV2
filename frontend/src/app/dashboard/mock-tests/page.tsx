"use client";

import { useState, useEffect } from "react";
import { 
  ClipboardCheck, 
  Clock, 
  BookOpen, 
  ChevronRight,
  AlertCircle,
  Trophy,
  Calendar,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FullPageSpinner } from "@/components/loading";
import Link from "next/link";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function MockTestsPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTests() {
      try {
        const res = await fetch("/api/users/mock-tests");
        if (res.ok) {
          const data = await res.json();
          setTests(data);
        }
      } catch (err) {
        toast.error("Could not load mock tests");
      } finally {
        setLoading(false);
      }
    }
    fetchTests();
  }, []);

  if (loading) return <FullPageSpinner />;

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Assigned Mock Tests</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Standardized assessments assigned to you by your organization.
        </p>
      </div>

      {tests.length === 0 ? (
        <div className="text-center py-20 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <Layers className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">No active tests</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto font-medium">
            You don&apos;t have any active mock tests from your organization right now. Check back later!
          </p>
        </div>
      ) : (
        <motion.div 
          variants={container} 
          initial="hidden" 
          animate="show"
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {tests.map((test) => {
            const hasAttempt = test.quiz_attempts && test.quiz_attempts.length > 0;
            const attempt = hasAttempt ? test.quiz_attempts[0] : null;

            return (
              <motion.div key={test.id} variants={item}>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden group hover:shadow-xl transition-all h-full flex flex-col relative">
                  {hasAttempt && (
                     <div className="absolute top-4 right-4 z-10">
                        <Badge className="bg-emerald-500 text-white border-0 shadow-lg">Completed</Badge>
                     </div>
                  )}

                  <div className="p-6 flex-1 space-y-4">
                    <div className="h-12 w-12 rounded-xl bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-100 dark:border-orange-800">
                       <ClipboardCheck className="h-6 w-6" />
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
                        {test.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {test.description || "Official assessment for preparation tracking."}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pb-2">
                       <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-400" />
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{test.time_limit}m Limit</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-slate-400" />
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{test.question_limit || "Full"} Qns</span>
                       </div>
                    </div>

                    {attempt ? (
                       <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/30 space-y-2">
                          <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest">Your Result</p>
                          <div className="flex items-baseline justify-between">
                             <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-emerald-700 dark:text-emerald-200">{attempt.score}</span>
                                <span className="text-xs text-emerald-500">/ {attempt.total_questions}</span>
                             </div>
                             <div className="bg-white/50 dark:bg-emerald-900/50 px-2 py-0.5 rounded-md text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                {((attempt.score / attempt.total_questions) * 100).toFixed(0)}%
                             </div>
                          </div>
                       </div>
                    ) : (
                       <div className="flex items-center gap-2 text-[11px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-100 dark:border-amber-900/30">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Mandatory Assessment
                       </div>
                    )}

                    <div className="pt-2 flex items-center justify-between text-[11px] font-medium text-slate-400 border-t border-slate-100 dark:border-slate-800">
                       <span className="flex items-center gap-1.5 capitalize py-2">
                          <Calendar className="h-3.5 w-3.5" />
                          Valid until {test.end_time ? new Date(test.end_time).toLocaleDateString() : "further notice"}
                       </span>
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <Link href={hasAttempt ? "#" : `/dashboard/quizzes/exam?id=${test.quiz_id || "mt-"+test.id}&mt=${test.id}`}>
                      <Button 
                        disabled={hasAttempt}
                        className={`w-full h-11 transition-all rounded-xl font-bold text-sm ${
                          hasAttempt 
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed" 
                            : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 active:scale-[0.98]"
                        }`}
                      >
                        {hasAttempt ? "Attempt Completed" : "Start Mock Test"}
                        {!hasAttempt && <ChevronRight className="h-4 w-4 ml-2" />}
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
