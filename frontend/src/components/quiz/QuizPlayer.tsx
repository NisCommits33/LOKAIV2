// components/quiz/QuizPlayer.tsx — Reusable Quiz Player Component
// Supports both GK and personal document quizzes

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Clock, ChevronLeft, ChevronRight, Send, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface QuizPlayerQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer?: number;
  explanation?: string;
}

interface QuizPlayerProps {
  questions: QuizPlayerQuestion[];
  timeLimitMinutes?: number; // optional, disables timer if not set
  onSubmit: (answers: Record<string, number>, timeSpent: number) => Promise<void> | void;
  loading?: boolean;
  title?: string;
  description?: string;
  difficulty?: string;
  category?: string;
  showStartScreen?: boolean;
}

export function QuizPlayer({
  questions,
  timeLimitMinutes,
  onSubmit,
  loading = false,
  title,
  description,
  difficulty,
  category,
  showStartScreen = false,
}: QuizPlayerProps) {
  const [started, setStarted] = useState(!showStartScreen);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(timeLimitMinutes ? timeLimitMinutes * 60 : 0);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [results, setResults] = useState<{ score: number; timeSpent: number; total: number; answers: Record<string, number> } | null>(null);
  const [reviewMode, setReviewMode] = useState(false);

  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submitRef = useRef<() => void>(() => {});

  // Update questions prop can be dangerous if we have results, so we should clear results if questions change
  useEffect(() => {
    setResults(null);
    setReviewMode(false);
    setCurrentIndex(0);
    setAnswers({});
    setStarted(!showStartScreen);
  }, [questions, showStartScreen]);

  // Keep ref in sync
  useEffect(() => {
    submitRef.current = handleSubmit;
  });

  // Timer
  useEffect(() => {
    if (!started || !timeLimitMinutes || results) return;
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
  }, [started, timeLimitMinutes, results]);

  function selectAnswer(optionIndex: number) {
    if (results && !reviewMode) return; // shouldn't happen but safe guard
    setAnswers((prev) => ({ ...prev, [questions[currentIndex].id]: optionIndex }));
  }

  function startQuiz() {
    setStarted(true);
    startTimeRef.current = Date.now();
  }

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    setShowConfirm(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
    
    // Calculate score locally for immediate feedback
    const score = questions.reduce((acc, q) => {
        // We assume the backend-provided 'questions' object in the parent might have correct_answer
        // But QuizPlayerQuestion interface doesn't have it. 
        // We need to update the interface or handle it if passed.
        const qExtended = q as any;
        return acc + (answers[q.id] === qExtended.correct_answer ? 1 : 0)
    }, 0);

    setResults({ score, timeSpent, total: questions.length, answers: { ...answers } });
    
    if (onSubmit) {
        await onSubmit(answers, timeSpent);
    }
    setSubmitting(false);
  }

  function resetQuiz() {
    setResults(null);
    setReviewMode(false);
    setCurrentIndex(0);
    setAnswers({});
    setStarted(!showStartScreen);
    setTimeLeft(timeLimitMinutes ? timeLimitMinutes * 60 : 0);
  }

  if (loading) return (
    <div className="py-20 flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
      <p className="text-slate-500 font-medium animate-pulse">Preparing your quiz...</p>
    </div>
  );

  if (!questions || questions.length === 0) return (
    <div className="py-20 text-center space-y-4">
      <div className="bg-slate-50 dark:bg-slate-800 h-16 w-16 rounded-full flex items-center justify-center mx-auto">
        <Send className="h-8 w-8 text-slate-300 dark:text-slate-600" />
      </div>
      <p className="text-slate-500 dark:text-slate-400 font-medium">No questions available for this document.</p>
    </div>
  );

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progressPercent = (answeredCount / questions.length) * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerDanger = timeLeft < 60;

  // Results screen
  if (results && !reviewMode) {
    const percentage = Math.round((results.score / results.total) * 100);
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 sm:p-8 max-w-2xl mx-auto"
      >
        <Card className="overflow-hidden border-none shadow-xl bg-white dark:bg-slate-900">
          <div className="h-2 bg-indigo-600 w-full" />
          <CardContent className="p-8 text-center space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Quiz Completed!</h2>
              <p className="text-slate-500 dark:text-slate-400">Here's how you performed on this document.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center gap-1">
                <span className="text-3xl font-black text-slate-900 dark:text-slate-50">{percentage}%</span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Score</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center gap-1">
                <span className="text-3xl font-black text-slate-900 dark:text-slate-50">{results.score}/{results.total}</span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Correct</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center gap-1">
                <span className="text-3xl font-black text-slate-900 dark:text-slate-50">{Math.floor(results.timeSpent / 60)}m {results.timeSpent % 60}s</span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Time</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                onClick={() => setReviewMode(true)} 
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 h-12 text-base font-bold shadow-none rounded-xl"
              >
                Review Answers
              </Button>
              <Button 
                variant="outline" 
                onClick={resetQuiz}
                className="flex-1 h-12 text-base font-bold border-slate-200 dark:border-slate-700"
              >
                Retake Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Pre-start screen
  if (!started && showStartScreen) {
    return (
      <div className="p-6 sm:p-8 max-w-2xl mx-auto">
        <Card className="shadow-2xl border-none bg-white dark:bg-slate-900 overflow-hidden">
          <div className="h-2 bg-slate-900 w-full" />
          <CardContent className="p-8 space-y-8">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {category && (
                  <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                    {category}
                  </Badge>
                )}
                {difficulty && (
                  <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1">
                    {difficulty}
                  </Badge>
                )}
              </div>
              <div className="space-y-1">
                <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight leading-none">{title || "Quiz Time"}</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">{description || "Test your knowledge on the document."}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Questions</p>
                <p className="text-slate-900 dark:text-slate-50 font-black text-2xl">{questions.length}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Time Limit</p>
                <p className="text-slate-900 dark:text-slate-50 font-black text-2xl">{timeLimitMinutes ? `${timeLimitMinutes}m` : "No limit"}</p>
              </div>
            </div>

            <Button onClick={startQuiz} className="w-full bg-slate-900 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200 hover:bg-slate-800 h-14 text-lg font-bold shadow-none transition-all active:scale-95" size="lg">
              Start Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quiz player / Review mode
  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      {/* Top bar: timer + progress */}
      <div className="flex items-center justify-between gap-6">
        <div className="flex-1 space-y-2">
          <div className="flex justify-between items-end">
            <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">
              {reviewMode ? "Reviewing Results" : "Quiz Progress"}
            </p>
            <p className="text-[10px] uppercase font-black tracking-widest text-slate-900 dark:text-slate-100">
              {reviewMode ? `${currentIndex + 1} / ${questions.length}` : `${answeredCount} / ${questions.length} Answered`}
            </p>
          </div>
          <Progress value={reviewMode ? ((currentIndex + 1) / questions.length) * 100 : progressPercent} className="h-1.5" />
        </div>
        {!reviewMode && timeLimitMinutes && (
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-sm font-black border transition-all shadow-sm", 
            timerDanger ? "bg-red-50 text-red-600 border-red-100 animate-pulse" : "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-100 dark:border-slate-800"
          )}>
            <Clock className="h-4 w-4" /> 
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
        )}
        {reviewMode && (
             <Button variant="outline" size="sm" onClick={() => setReviewMode(false)} className="h-10 px-4 rounded-xl font-bold border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                Back to Results
             </Button>
        )}
      </div>

      {/* Question navigation dots */}
      <div className="flex flex-wrap gap-2">
        {questions.map((q, i) => {
          const isAnswered = answers[q.id] !== undefined;
          const isCorrect = reviewMode && answers[q.id] === (q as any).correct_answer;
          const isWrong = reviewMode && isAnswered && answers[q.id] !== (q as any).correct_answer;

          return (
            <button 
              key={q.id} 
              onClick={() => setCurrentIndex(i)} 
              className={cn(
                "h-9 w-9 rounded-xl text-xs font-black transition-all border",
                i === currentIndex 
                  ? "bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 border-slate-900 dark:border-slate-50 shadow-md ring-2 ring-slate-100 dark:ring-slate-800" 
                  : reviewMode
                    ? isCorrect
                        ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800"
                        : isWrong
                            ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700"
                    : isAnswered 
                        ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800" 
                        : "bg-white dark:bg-slate-900 text-slate-400 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentIndex} 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          exit={{ opacity: 0, y: -10 }} 
          transition={{ duration: 0.2 }}
        >
          <Card className="shadow-xl border-none bg-white dark:bg-slate-900 overflow-hidden">
            <CardContent className="p-6 sm:p-8 space-y-8">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-black tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded">
                        Question {currentIndex + 1}
                    </span>
                    {reviewMode && (
                        <span className={cn(
                            "text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded",
                            answers[currentQuestion.id] === (currentQuestion as any).correct_answer 
                                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" 
                                : "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"
                        )}>
                            {answers[currentQuestion.id] === (currentQuestion as any).correct_answer ? "Correct" : "Incorrect"}
                        </span>
                    )}
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 leading-tight">{currentQuestion.question}</h2>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((option, optIdx) => {
                  const isSelected = answers[currentQuestion.id] === optIdx;
                  const isCorrect = reviewMode && optIdx === (currentQuestion as any).correct_answer;
                  const isUserWrong = reviewMode && isSelected && !isCorrect;

                  return (
                    <button 
                      key={optIdx} 
                      onClick={() => !reviewMode && selectAnswer(optIdx)} 
                      disabled={reviewMode}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-xl border text-left text-sm font-bold transition-all group",
                        reviewMode
                            ? isCorrect
                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300"
                                : isUserWrong
                                    ? "border-red-500 bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-300"
                                    : isSelected 
                                        ? "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400"
                                        : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-300 dark:text-slate-600"
                            : isSelected 
                                ? "border-indigo-200 dark:border-indigo-500/50 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-100 shadow-sm" 
                                : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-200 dark:hover:border-slate-700"
                      )}
                    > 
                      <span className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black transition-colors shadow-sm", 
                        reviewMode
                            ? isCorrect
                                ? "bg-emerald-500 text-white"
                                : isUserWrong
                                    ? "bg-red-500 text-white"
                                    : "bg-slate-100 text-slate-400"
                            : isSelected 
                                ? "bg-indigo-600 text-white" 
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                      )}>
                        {String.fromCharCode(65 + optIdx)}
                      </span> 
                      {option} 

                      {reviewMode && isCorrect && (
                          <div className="ml-auto flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-600">
                             <CheckCircle2 className="h-4 w-4" /> Correct Answer
                          </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation in Review Mode */}
              {reviewMode && (currentQuestion as any).explanation && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: "auto" }}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 space-y-1.5"
                  >
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Explanation</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{(currentQuestion as any).explanation}</p>
                  </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation controls */}
      <div className="flex items-center justify-between gap-4">
        <Button 
            variant="outline" 
            size="lg" 
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))} 
            disabled={currentIndex === 0} 
            className="rounded-2xl h-12 px-6 font-bold border-slate-200 dark:border-slate-700 gap-2 shadow-sm"
        > 
            <ChevronLeft className="h-4 w-4" /> Previous 
        </Button>
        
        {currentIndex < questions.length - 1 ? (
          <Button 
            size="lg" 
            onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))} 
            className="rounded-xl h-12 px-8 font-bold bg-slate-900 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200 hover:bg-slate-800 gap-2 shadow-none"
          > 
            Next <ChevronRight className="h-4 w-4" /> 
          </Button>
        ) : !reviewMode ? (
          <Button 
            size="lg" 
            onClick={() => setShowConfirm(true)} 
            disabled={submitting} 
            className="rounded-xl h-12 px-8 font-bold bg-indigo-600 hover:bg-indigo-700 gap-2 shadow-none"
          > 
            <Send className="h-4 w-4" /> Finish Quiz 
          </Button>
        ) : (
            <Button 
                size="lg" 
                onClick={() => setReviewMode(false)} 
                className="rounded-xl h-12 px-8 font-bold bg-slate-900 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200 hover:bg-slate-800 gap-2 shadow-none"
            > 
                Done Reviewing
            </Button>
        )}
      </div>

      {/* Submit confirmation dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="rounded-3xl p-8 border-none shadow-2xl dark:bg-slate-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-slate-900 dark:text-slate-50">Finish and Submit?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 dark:text-slate-400 font-medium pb-2">
              You've answered {answeredCount} out of {questions.length} questions.
              {answeredCount < questions.length && (
                <span className="block mt-2 p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-bold border border-amber-100 dark:border-amber-800 flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {questions.length - answeredCount} question{questions.length - answeredCount > 1 ? "s" : ""} left unanswered.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-2 gap-3">
            <AlertDialogCancel disabled={submitting} className="rounded-2xl h-12 px-6 font-bold border-slate-200 dark:border-slate-700">Go Back</AlertDialogCancel>
            <AlertDialogAction 
                onClick={(e) => { e.preventDefault(); handleSubmit(); }} 
                disabled={submitting} 
                className="rounded-xl h-12 px-8 font-bold bg-indigo-600 hover:bg-indigo-700 shadow-none"
            >
                {submitting ? "Submitting..." : "Yes, Finish Quiz"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
