"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FullPageSpinner } from "@/components/loading";
import {
  ArrowLeft,
  History,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { QuizAttemptWithQuiz, QuizDifficulty } from "@/types/database";
import { cn } from "@/lib/utils";

const difficultyColors: Record<QuizDifficulty, string> = {
  easy: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800",
  medium: "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800",
  hard: "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800",
};

const PAGE_SIZE = 20;

export default function QuizHistoryPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();

  const [attempts, setAttempts] = useState<QuizAttemptWithQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  async function fetchHistory(currentOffset: number, append = false) {
    if (append) setLoadingMore(true);
    else setLoading(true);

    const res = await fetch(
      `/api/gk/history?limit=${PAGE_SIZE}&offset=${currentOffset}`
    );
    if (res.ok) {
      const data = await res.json();
      setAttempts((prev) =>
        append ? [...prev, ...data.attempts] : data.attempts
      );
      setTotal(data.total ?? 0);
    }

    if (append) setLoadingMore(false);
    else setLoading(false);
  }

  useEffect(() => {
    fetchHistory(0);
  }, []);

  function loadMore() {
    const next = offset + PAGE_SIZE;
    setOffset(next);
    fetchHistory(next, true);
  }

  if (authLoading || loading) return <FullPageSpinner />;

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/quizzes")}
            className="h-10 w-10 p-0 rounded-full border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-900 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Quiz History
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              {total} attempt{total !== 1 ? "s" : ""} recorded
            </p>
          </div>
        </div>
      </div>

      {/* Attempts list */}
      {attempts.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800 bg-transparent">
          <CardContent className="text-center py-20 space-y-4">
            <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto">
              <History className="h-8 w-8 text-slate-300 dark:text-slate-600" />
            </div>
            <div>
              <p className="text-slate-900 dark:text-slate-100 font-bold">No quiz history found</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Complete your first quiz to track your progress here.
              </p>
            </div>
            <Button
              onClick={() => router.push("/dashboard/quizzes")}
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Start Learning Now
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4">
            {attempts.map((attempt, i) => {
              const percentage = Math.round(
                (attempt.score / attempt.total_questions) * 100
              );
              const quizMeta = attempt.gk_quizzes;
              const date = new Date(attempt.created_at).toLocaleDateString(
                "en-US",
                { month: "short", day: "numeric" }
              );
              const time = new Date(attempt.created_at).toLocaleTimeString(
                "en-US",
                { hour: "2-digit", minute: "2-digit" }
              );

              return (
                <motion.div
                  key={attempt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className="group border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-100 dark:hover:border-indigo-500/30 hover:shadow-lg dark:hover:shadow-indigo-500/10 transition-all duration-300 rounded-2xl overflow-hidden cursor-pointer">
                    <Link href={`/dashboard/quizzes/${attempt.quiz_id}/results/${attempt.id}`} className="flex items-center gap-4 p-5">
                      {/* Score ring */}
                      <div
                        className={cn(
                          "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 transition-all group-hover:scale-105",
                          percentage >= 80
                            ? "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30"
                            : percentage >= 60
                              ? "border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/30"
                              : "border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-950/30"
                        )}
                      >
                        <span
                          className={cn(
                            "text-base font-black",
                            percentage >= 80
                              ? "text-emerald-600 dark:text-emerald-400"
                              : percentage >= 60
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-red-600 dark:text-red-400"
                          )}
                        >
                          {percentage}%
                        </span>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {quizMeta?.title ?? "Unknown Quiz"}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          {quizMeta?.category && (
                            <Badge
                              variant="secondary"
                              className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 text-[10px] font-bold uppercase tracking-wider"
                            >
                              {quizMeta.category}
                            </Badge>
                          )}
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5 ml-1">
                             <Trophy className="h-3 w-3" /> {attempt.score}/{attempt.total_questions}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                         <p className="text-xs font-black text-slate-900 dark:text-slate-200">{date}</p>
                         <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{time}</p>
                      </div>
                    </Link>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Load more */}
          {attempts.length < total && (
            <div className="text-center pt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={loadMore}
                disabled={loadingMore}
                className="px-8 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400"
              >
                {loadingMore ? "Loading..." : "Load More Activity"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
