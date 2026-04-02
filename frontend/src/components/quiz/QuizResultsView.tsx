/**
 * QuizResultsView — GK-style quiz results display
 *
 * Reusable component showing:
 * - Score percentage ring with color coding
 * - Performance message
 * - Stats grid (Correct, Incorrect, Unanswered, Time Spent)
 * - Full question review with correct/incorrect highlights and explanations
 * - Retake / Back action buttons
 */

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  RotateCcw,
  ArrowLeft,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface QuizResultQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
}

interface QuizResultsViewProps {
  score: number;
  total: number;
  timeSpent: number;
  questions: QuizResultQuestion[];
  userAnswers: Record<string, number>;
  title?: string;
  onRetake?: () => void;
  onBack?: () => void;
  backLabel?: string;
}

export function QuizResultsView({
  score,
  total,
  timeSpent,
  questions,
  userAnswers,
  title,
  onRetake,
  onBack,
  backLabel = "Back",
}: QuizResultsViewProps) {
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const incorrect = questions.filter(
    (q) => userAnswers[q.id] !== undefined && userAnswers[q.id] !== q.correct_answer
  ).length;
  const unanswered = questions.filter(
    (q) => userAnswers[q.id] === undefined
  ).length;

  const minutes = Math.floor(timeSpent / 60);
  const seconds = timeSpent % 60;

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
    <div className="max-w-3xl mx-auto space-y-6">
      {onBack && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-1 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          <ArrowLeft className="h-4 w-4" /> {backLabel}
        </Button>
      )}

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
                {title && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                    {title}
                  </p>
                )}
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-center">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                  {score}
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
            {onRetake && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 gap-2 border-slate-200 dark:border-slate-800 dark:text-slate-300"
                  onClick={onRetake}
                >
                  <RotateCcw className="h-4 w-4" /> Retake Quiz
                </Button>
              </div>
            )}
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
