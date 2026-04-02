/**
 * dashboard/quizzes/[id]/results/[attemptId]/page.tsx — Quiz Results
 *
 * Displays quiz results after submission:
 * - Score percentage with visual ring
 * - Correct/incorrect/unanswered counts
 * - Time spent
 * - Full question review with correct answers and explanations
 * - Retake and back-to-quizzes buttons
 *
 * @module app/dashboard/quizzes/[id]/results/[attemptId]
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FullPageSpinner } from "@/components/loading";
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  RotateCcw,
  ArrowLeft,
  Clock,
  Trophy,
} from "lucide-react";
import { motion } from "framer-motion";
import type { QuizQuestion, QuizAttempt, QuizDifficulty } from "@/types/database";
import { cn } from "@/lib/utils";

const difficultyColors: Record<QuizDifficulty, string> = {
  easy: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800",
  medium: "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800",
  hard: "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800",
};

interface ResultData {
  attempt: QuizAttempt;
  quiz: {
    title: string;
    category: string;
    difficulty: QuizDifficulty;
    questions: QuizQuestion[];
    total_questions: number;
    time_limit_minutes: number;
  };
}

export default function QuizResultsPage() {
  const router = useRouter();
  const { id, attemptId } = useParams<{ id: string; attemptId: string }>();
  const { isLoading: authLoading } = useAuth();

  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResults() {
      const res = await fetch(`/api/gk/results/${attemptId}`);
      if (res.ok) {
        setData(await res.json());
      } else {
        router.push("/dashboard/quizzes");
      }
      setLoading(false);
    }
    fetchResults();
  }, [attemptId, router]);

  if (authLoading || loading) return <FullPageSpinner />;
  if (!data) return null;

  const { attempt, quiz } = data;
  const { questions } = quiz;
  const userAnswers = attempt.answers as Record<string, number>;
  const percentage = Math.round((attempt.score / attempt.total_questions) * 100);
  const incorrect = questions.filter(
    (q) => userAnswers[q.id] !== undefined && userAnswers[q.id] !== q.correct_answer
  ).length;
  const unanswered = questions.filter(
    (q) => userAnswers[q.id] === undefined
  ).length;

  const minutes = Math.floor(attempt.time_spent / 60);
  const seconds = attempt.time_spent % 60;

  /** Score message & colour */
  let scoreColor = "text-red-600 dark:text-red-400";
  let scoreMsg = "Keep practicing!";
  if (percentage >= 80) {
    scoreColor = "text-emerald-600 dark:text-emerald-400";
    scoreMsg = "Excellent work!";
  } else if (percentage >= 60) {
    scoreColor = "text-amber-600 dark:text-amber-400";
    scoreMsg = "Good effort!";
  } else if (percentage >= 40) {
    scoreColor = "text-orange-600 dark:text-orange-400";
    scoreMsg = "Room for improvement";
  }

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto space-y-6">
      {/* Navigation */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/dashboard/quizzes")}
        className="gap-1 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Quizzes
      </Button>

      {/* Score card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="shadow-none border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div
                  className={cn(
                    "flex h-24 w-24 items-center justify-center rounded-full border-4",
                    percentage >= 80
                      ? "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30"
                      : percentage >= 60
                        ? "border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/30"
                        : "border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-950/30"
                  )}
                >
                  <div className="text-center">
                    <p className={cn("text-2xl font-black", scoreColor)}>
                      {percentage}%
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <p className={cn("text-lg font-bold", scoreColor)}>
                  {scoreMsg}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {quiz.title}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <Badge
                  variant="secondary"
                  className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 text-[10px] font-bold uppercase tracking-wider"
                >
                  {quiz.category}
                </Badge>
                <Badge
                  variant="secondary"
                  className={`border text-[10px] font-bold uppercase tracking-wider \${difficultyColors[quiz.difficulty]}`}
                >
                  {quiz.difficulty}
                </Badge>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-center">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                  {attempt.score}
                </p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-bold uppercase tracking-wider">
                  Correct
                </p>
              </div>
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-center">
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-red-700 dark:text-red-400">{incorrect}</p>
                <p className="text-[10px] text-red-600 dark:text-red-500 font-bold uppercase tracking-wider">
                  Incorrect
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
                <MinusCircle className="h-4 w-4 text-slate-500 dark:text-slate-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{unanswered}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-wider">
                  Unanswered
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
                <Clock className="h-4 w-4 text-slate-500 dark:text-slate-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                  {minutes}:{String(seconds).padStart(2, "0")}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-wider">
                  Time Spent
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 gap-2 border-slate-200 dark:border-slate-800 dark:text-slate-300"
                onClick={() => router.push(`/dashboard/quizzes/${id}`)}
              >
                <RotateCcw className="h-4 w-4" /> Retake Quiz
              </Button>
              <Button
                className="flex-1 gap-2 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white"
                onClick={() => router.push("/dashboard/quizzes")}
              >
                <Trophy className="h-4 w-4" /> Browse Quizzes
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Question review */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Question Review</h2>
        {questions.map((q, i) => {
          const userAnswer = userAnswers[q.id];
          const isCorrect = userAnswer === q.correct_answer;
          const isUnanswered = userAnswer === undefined;

          return (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card
                className={cn(
                  "shadow-none border overflow-hidden bg-white dark:bg-slate-900",
                  isUnanswered
                    ? "border-slate-100 dark:border-slate-800"
                    : isCorrect
                      ? "border-emerald-100 dark:border-emerald-900/50"
                      : "border-red-100 dark:border-red-900/50"
                )}
              >
                <CardContent className="p-5 space-y-4">
                  {/* Question header */}
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-black mt-0.5",
                        isUnanswered
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-500"
                          : isCorrect
                            ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400"
                            : "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400"
                      )}
                    >
                      {i + 1}
                    </span>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-200 leading-relaxed">
                      {q.question}
                    </p>
                  </div>

                  {/* Options */}
                  <div className="grid gap-2 ml-9">
                    {q.options.map((opt, optIdx) => {
                      const isUserChoice = userAnswer === optIdx;
                      const isCorrectOption = q.correct_answer === optIdx;

                      return (
                        <div
                          key={optIdx}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition-all border",
                            isCorrectOption
                              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800"
                              : isUserChoice && !isCorrect
                                ? "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-100 dark:border-red-800"
                                : "text-slate-600 dark:text-slate-400 border-transparent"
                          )}
                        >
                          <span className="font-black text-[10px] w-4 opacity-70">
                            {String.fromCharCode(65 + optIdx)}.
                          </span>
                          <span className="flex-1">{opt}</span>
                          {isCorrectOption && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-500" />
                          )}
                          {isUserChoice && !isCorrect && (
                            <XCircle className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {q.explanation && (
                    <div className="ml-9 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30">
                      <div className="flex gap-2 items-start">
                         <div className="h-4 w-4 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">i</span>
                         </div>
                         <p className="text-xs text-blue-800 dark:text-blue-300 font-medium leading-relaxed">
                           {q.explanation}
                         </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
