/**
 * dashboard/quizzes/[id]/page.tsx — GK Quiz Player
 *
 * Interactive quiz player with:
 * - Countdown timer (auto-submit on timeout)
 * - Question navigation dots
 * - Answer selection with visual feedback
 * - Previous / Next / Submit controls
 * - Confirmation dialog before submit
 *
 * @module app/dashboard/quizzes/[id]
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FullPageSpinner } from "@/components/loading";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { GKQuiz, QuizQuestion, QuizDifficulty } from "@/types/database";
import { cn } from "@/lib/utils";

const difficultyColors: Record<QuizDifficulty, string> = {
  easy: "bg-emerald-50 text-emerald-700 border-emerald-100",
  medium: "bg-amber-50 text-amber-700 border-amber-100",
  hard: "bg-red-50 text-red-700 border-red-100",
};

export default function QuizPlayerPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { isLoading: authLoading } = useAuth();

  const [quiz, setQuiz] = useState<GKQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submitRef = useRef<() => void>(() => {});

  // Fetch quiz
  useEffect(() => {
    async function fetchQuiz() {
      // 1. Determine the correct fetch URL
      const fetchUrl = id === "custom" 
        ? `/api/gk/quizzes/custom?${searchParams.toString()}` 
        : `/api/gk/quizzes/${id}`;

      const res = await fetch(fetchUrl);
      if (res.ok) {
        const data: GKQuiz = await res.json();
        setQuiz(data);
        // Ensure timer is set (Some custom quizzes might have 0/null for 'no timer')
        if (data.time_limit_minutes && data.time_limit_minutes > 0) {
          setTimeLeft(data.time_limit_minutes * 60);
        } else {
          setTimeLeft(0);
        }
      } else {
        router.push("/dashboard/quizzes");
      }
      setLoading(false);
    }
    fetchQuiz();
  }, [id, searchParams, router]);

  // Submit handler
  const handleSubmit = useCallback(async () => {
    if (submitting || !quiz) return;
    setSubmitting(true);
    setShowConfirm(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);

    const isCustom = id === "custom";
    const submitUrl = isCustom ? "/api/gk/quizzes/custom/submit" : `/api/gk/quizzes/${id}/submit`;

    try {
      const res = await fetch(submitUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          answers, 
          questions: isCustom ? quiz.questions : undefined, // Send questions for virtual verification
          time_spent: timeSpent,
          metadata: isCustom ? { category: quiz.category, difficulty: quiz.difficulty } : undefined
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const resultUrl = isCustom 
          ? `/dashboard/quizzes/results/${data.attempt_id}?custom=true`
          : `/dashboard/quizzes/${id}/results/${data.attempt_id}`;
          
        router.push(resultUrl);
      } else {
        const err = await res.json().catch(() => null);
        console.error("Submit failed:", res.status, err);
        setSubmitting(false);
      }
    } catch (e) {
      console.error("Submit error:", e);
      setSubmitting(false);
    }
  }, [submitting, quiz, id, answers, router]);

  // Keep ref in sync so the timer always calls the latest version
  useEffect(() => {
    submitRef.current = handleSubmit;
  }, [handleSubmit]);

  // Timer — uses submitRef so it doesn't depend on handleSubmit directly
  useEffect(() => {
    if (!started || !quiz) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          submitRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started, quiz]);

  if (authLoading || loading) return <FullPageSpinner />;
  if (!quiz) return null;

  const questions: QuizQuestion[] = quiz.questions;
  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progressPercent = (answeredCount / questions.length) * 100;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerDanger = timeLeft < 60;

  function selectAnswer(optionIndex: number) {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionIndex }));
  }

  function startQuiz() {
    setStarted(true);
    startTimeRef.current = Date.now();
  }

  // Pre-start screen
  if (!started) {
    return (
      <div className="p-6 sm:p-8 max-w-2xl mx-auto space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/quizzes")}
          className="gap-1 text-slate-500"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Quizzes
        </Button>

        <Card className="shadow-none border border-slate-100">
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="secondary"
                  className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-bold uppercase tracking-wider"
                >
                  {quiz.category}
                </Badge>
                <Badge
                  variant="secondary"
                  className={`border text-[10px] font-bold uppercase tracking-wider ${difficultyColors[quiz.difficulty]}`}
                >
                  {quiz.difficulty}
                </Badge>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                {quiz.title}
              </h1>
              {quiz.description && (
                <p className="text-sm text-slate-500 font-medium">
                  {quiz.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-slate-50">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                  Questions
                </p>
                <p className="text-slate-900 font-bold text-lg">
                  {quiz.total_questions}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                  Time Limit
                </p>
                <p className="text-slate-900 font-bold text-lg">
                  {quiz.time_limit_minutes} min
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 flex gap-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-xs text-amber-700 font-medium space-y-1">
                <p>The quiz will auto-submit when the timer runs out.</p>
                <p>You can navigate between questions and change your answers before submitting.</p>
              </div>
            </div>

            <Button
              onClick={startQuiz}
              className="w-full bg-slate-900 hover:bg-slate-800"
              size="lg"
            >
              Start Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quiz player
  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4">
      {/* Top bar: timer + progress */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <Progress value={progressPercent} className="h-2" />
          <p className="text-xs text-slate-400 font-medium mt-1">
            {answeredCount} of {questions.length} answered
          </p>
        </div>
        <div
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-sm font-bold",
            timerDanger
              ? "bg-red-50 text-red-600 animate-pulse"
              : "bg-slate-50 text-slate-700"
          )}
        >
          <Clock className="h-4 w-4" />
          {timeLeft > 0 ? (
            `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
          ) : (
             <span className="text-[10px] uppercase tracking-wider">Unlimited</span>
          )}
        </div>
      </div>

      {/* Question navigation dots */}
      <div className="flex flex-wrap gap-1.5">
        {questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => setCurrentIndex(i)}
            className={cn(
              "h-7 w-7 rounded-md text-xs font-bold transition-colors",
              i === currentIndex
                ? "bg-slate-900 text-white"
                : answers[q.id] !== undefined
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.15 }}
        >
          <Card className="shadow-none border border-slate-100">
            <CardContent className="p-5 sm:p-6 space-y-5">
              <div className="space-y-1">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  Question {currentIndex + 1} of {questions.length}
                </p>
                <h2 className="text-base font-bold text-slate-900 leading-relaxed">
                  {currentQuestion.question}
                </h2>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {currentQuestion.options.map((option, optIdx) => {
                  const isSelected = answers[currentQuestion.id] === optIdx;
                  return (
                    <button
                      key={optIdx}
                      onClick={() => selectAnswer(optIdx)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3.5 rounded-lg border text-left text-sm font-medium transition-all",
                        isSelected
                          ? "border-indigo-200 bg-indigo-50 text-indigo-900"
                          : "border-slate-100 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-200"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-500"
                        )}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      {option}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation controls */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>

        {currentIndex < questions.length - 1 ? (
          <Button
            size="sm"
            onClick={() =>
              setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))
            }
            className="gap-1 bg-slate-900 hover:bg-slate-800"
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => setShowConfirm(true)}
            disabled={submitting}
            className="gap-1 bg-indigo-600 hover:bg-indigo-700"
          >
            <Send className="h-4 w-4" /> Submit Quiz
          </Button>
        )}
      </div>

      {/* Submit confirmation dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {answeredCount} out of {questions.length}{" "}
              questions.
              {answeredCount < questions.length && (
                <span className="block mt-1 text-amber-600 font-medium">
                  {questions.length - answeredCount} question
                  {questions.length - answeredCount > 1 ? "s" : ""} unanswered.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>
              Continue Quiz
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {submitting ? "Submitting..." : "Submit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
