/**
 * dashboard/quizzes/history/page.tsx — Quiz History
 *
 * Lists the user's past quiz attempts with:
 * - Quiz title, category, difficulty
 * - Score and percentage
 * - Date taken
 * - Link to review results
 * - Pagination via load-more
 *
 * @module app/dashboard/quizzes/history
 */

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
  Eye,
  Trophy,
} from "lucide-react";
import { motion } from "framer-motion";
import type { QuizAttemptWithQuiz, QuizDifficulty } from "@/types/database";
import { cn } from "@/lib/utils";

const difficultyColors: Record<QuizDifficulty, string> = {
  easy: "bg-emerald-50 text-emerald-700 border-emerald-100",
  medium: "bg-amber-50 text-amber-700 border-amber-100",
  hard: "bg-red-50 text-red-700 border-red-100",
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
    <div className="p-6 sm:p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/quizzes")}
            className="gap-1 text-slate-500"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Quiz History
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              {total} attempt{total !== 1 ? "s" : ""} total
            </p>
          </div>
        </div>
      </div>

      {/* Attempts list */}
      {attempts.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <History className="h-10 w-10 text-slate-300 mx-auto" />
          <p className="text-slate-500 font-medium">No quiz attempts yet</p>
          <p className="text-sm text-slate-400">
            Start a quiz to see your history here
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/quizzes")}
            className="mt-2"
          >
            Browse Quizzes
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {attempts.map((attempt, i) => {
            const percentage = Math.round(
              (attempt.score / attempt.total_questions) * 100
            );
            const quizMeta = attempt.gk_quizzes;
            const date = new Date(attempt.created_at).toLocaleDateString(
              "en-US",
              { month: "short", day: "numeric", year: "numeric" }
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
                <Card className="shadow-none border border-slate-100 overflow-hidden hover:border-slate-200 transition-colors">
                  <CardContent className="p-4 flex items-center gap-4">
                    {/* Score circle */}
                    <div
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2",
                        percentage >= 80
                          ? "border-emerald-200 bg-emerald-50"
                          : percentage >= 60
                            ? "border-amber-200 bg-amber-50"
                            : "border-red-200 bg-red-50"
                      )}
                    >
                      <span
                        className={cn(
                          "text-sm font-black",
                          percentage >= 80
                            ? "text-emerald-600"
                            : percentage >= 60
                              ? "text-amber-600"
                              : "text-red-600"
                        )}
                      >
                        {percentage}%
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {quizMeta?.title ?? "Unknown Quiz"}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {quizMeta?.category && (
                          <Badge
                            variant="secondary"
                            className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[9px] font-bold uppercase tracking-wider"
                          >
                            {quizMeta.category}
                          </Badge>
                        )}
                        {quizMeta?.difficulty && (
                          <Badge
                            variant="secondary"
                            className={`border text-[9px] font-bold uppercase tracking-wider ${difficultyColors[quizMeta.difficulty]}`}
                          >
                            {quizMeta.difficulty}
                          </Badge>
                        )}
                        <span className="text-xs text-slate-400 font-medium">
                          {attempt.score}/{attempt.total_questions} correct
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {date} at {time}
                      </p>
                    </div>

                    {/* View details */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        router.push(
                          `/dashboard/quizzes/${attempt.quiz_id}/results/${attempt.id}`
                        )
                      }
                      className="gap-1 text-slate-500 shrink-0"
                    >
                      <Eye className="h-4 w-4" /> Review
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          {/* Load more */}
          {attempts.length < total && (
            <div className="text-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
