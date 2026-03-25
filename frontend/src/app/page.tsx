/**
 * page.tsx — Landing Page (Home)
 *
 * The public-facing homepage that serves as the entry point for the platform.
 * Features:
 * - Hero section with platform introduction and CTA
 * - Interactive GK quiz demo (5 Nepal-focused questions)
 * - Project summary with key feature highlights
 *
 * Authenticated users are automatically redirected to /dashboard.
 *
 * @module app/page
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  BrainCircuit,
  CheckCircle2,
  Globe2,
  XCircle,
  ChevronRight,
  RotateCcw,
} from "lucide-react";

/** Sample GK questions for the interactive landing page quiz demo */
const quizQuestions = [
  {
    question:
      "In which year was the Treaty of Sugauli signed between Nepal and the British East India Company?",
    options: ["1814", "1815", "1816", "1817"],
    answer: 2,
  },
  {
    question:
      "How many provinces are there in Nepal according to the 2015 Constitution?",
    options: ["5", "6", "7", "8"],
    answer: 2,
  },
  {
    question: "Which is the highest peak of the Annapurna massif?",
    options: [
      "Annapurna II (7,937m)",
      "Annapurna I (8,091m)",
      "Annapurna III (7,555m)",
      "Annapurna IV (7,525m)",
    ],
    answer: 1,
  },
  {
    question: "Who is known as the 'Iron Man' of Nepal?",
    options: [
      "Prithvi Narayan Shah",
      "Jung Bahadur Rana",
      "Bhimsen Thapa",
      "Amar Singh Thapa",
    ],
    answer: 2,
  },
  {
    question:
      "Which river is the longest river that flows entirely within Nepal?",
    options: ["Koshi", "Karnali", "Bagmati", "Narayani"],
    answer: 1,
  },
];

export default function Home() {
  const { dbUser, isLoading } = useAuth();
  const router = useRouter();

  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!isLoading && dbUser) {
      router.replace("/dashboard");
    }
  }, [dbUser, isLoading, router]);

  /** Handles answer selection and score tracking */
  const handleSelect = useCallback(
    (idx: number) => {
      if (selected !== null) return;
      setSelected(idx);
      if (idx === quizQuestions[currentQ].answer) {
        setScore((s) => s + 1);
      }
    },
    [selected, currentQ]
  );

  /** Advances to the next question or finishes the quiz */
  const handleNext = useCallback(() => {
    if (currentQ < quizQuestions.length - 1) {
      setCurrentQ((q) => q + 1);
      setSelected(null);
    } else {
      setFinished(true);
    }
  }, [currentQ]);

  /** Resets the quiz to its initial state */
  const handleRestart = useCallback(() => {
    setCurrentQ(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  }, []);

  // Show a loading spinner while checking auth state or if user is logged in
  if (isLoading || dbUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
      </div>
    );
  }

  const q = quizQuestions[currentQ];

  return (
    <div className="relative bg-white text-slate-900">
      {/* Hero Section */}
      <div className="pt-16 pb-12 sm:pt-20 sm:pb-20 border-b border-slate-50">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <div className="mb-8 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <Sparkles className="h-3 w-3 text-indigo-500" />
              LokAI v2.0 Available for 2081
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1]">
              Nepal&apos;s AI-Powered <br />
              Exam Preparation Platform.
            </h1>
            <p className="mt-8 text-lg text-slate-500 font-medium leading-relaxed max-w-2xl">
              A comprehensive environment for civil service aspirants. Harness AI
              for document intelligence, manage official materials securely, and
              master GK with ease.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link href="/login">
                <Button
                  size="lg"
                  className="h-12 px-8 text-base font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-none transition-all"
                >
                  Start Preparation
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/register-organization">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-8 text-base font-semibold rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 shadow-none transition-all"
                >
                  Register Organization
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </Container>
      </div>

      {/* GK Quiz CTA Section */}
      <div className="py-20 bg-slate-900 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-indigo-500 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-indigo-500 blur-[120px]" />
        </div>
        <Container>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-xl space-y-6 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                <BrainCircuit className="h-3 w-3" />
                Now in Public Beta
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
                Ready to Master the <br />
                <span className="text-indigo-400 italic">General Knowledge</span>{" "}
                Section?
              </h2>
              <p className="text-slate-400 text-lg font-medium leading-relaxed">
                Dive into our curated question bank covering Nepal&apos;s
                Constitution, History, Geography, and current affairs. Practice
                with a live timer and track your progress.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                <Link href="/login" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="h-14 w-full sm:w-auto px-10 text-base font-bold rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white shadow-xl shadow-indigo-500/20 transition-all active:scale-95"
                  >
                    Start Free Practice
                    <Sparkles className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login" className="w-full sm:w-auto">
                  <Button
                    variant="ghost"
                    className="h-14 w-full sm:w-auto px-8 text-base font-bold rounded-2xl text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                  >
                    Sign in to track progress
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative w-full max-w-sm">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-indigo-500/0 rounded-[32px] blur opacity-25" />
              <div className="relative bg-black/40 border border-white/5 backdrop-blur-sm rounded-[32px] p-8 min-h-[480px] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Try It Now
                  </span>
                  <span className="text-[10px] font-bold text-indigo-400 tabular-nums">
                    {finished
                      ? `${score}/${quizQuestions.length}`
                      : `${currentQ + 1} / ${quizQuestions.length}`}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-1 w-full rounded-full bg-white/5 mb-6">
                  <motion.div
                    className="h-full rounded-full bg-indigo-500"
                    initial={false}
                    animate={{
                      width: finished
                        ? "100%"
                        : `${((currentQ + (selected !== null ? 1 : 0)) / quizQuestions.length) * 100}%`,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                <div className="flex-1 relative">
                  <AnimatePresence mode="wait">
                    {finished ? (
                      <motion.div
                        key="result"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="absolute inset-0 flex flex-col items-center justify-center space-y-5 text-center"
                      >
                        <div className="text-5xl font-black text-white tabular-nums">
                          {score}/{quizQuestions.length}
                        </div>
                        <p className="text-sm font-semibold text-slate-400">
                          {score === quizQuestions.length
                            ? "Perfect score! You're ready."
                            : score >= 3
                              ? "Great job! Keep practicing."
                              : "Keep going — practice makes perfect."}
                        </p>
                        <div className="flex flex-col gap-3 pt-2 w-full">
                          <button
                            onClick={handleRestart}
                            className="flex items-center justify-center gap-2 p-3 rounded-xl border border-white/10 bg-white/5 text-sm font-bold text-white hover:bg-white/10 transition-all cursor-pointer"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Try Again
                          </button>
                          <Link href="/login">
                            <button className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-indigo-500 text-sm font-bold text-white hover:bg-indigo-400 transition-all cursor-pointer">
                              Sign Up for More
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </Link>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key={currentQ}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="absolute inset-0 flex flex-col"
                      >
                        <p className="text-white font-bold text-lg leading-snug mb-5">
                          &ldquo;{q.question}&rdquo;
                        </p>
                        <div className="space-y-3 flex-1">
                          {q.options.map((opt, i) => {
                            let borderClass = "border-white/5 bg-white/5";
                            let textClass = "text-slate-400";
                            let iconEl = null;

                            if (selected !== null) {
                              if (i === q.answer) {
                                borderClass =
                                  "ring-1 ring-emerald-500/50 bg-emerald-500/10 border-emerald-500/20";
                                textClass = "text-emerald-400";
                                iconEl = (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                );
                              } else if (i === selected && i !== q.answer) {
                                borderClass =
                                  "ring-1 ring-red-500/50 bg-red-500/10 border-red-500/20";
                                textClass = "text-red-400";
                                iconEl = (
                                  <XCircle className="h-3.5 w-3.5 text-red-400" />
                                );
                              }
                            }

                            return (
                              <button
                                key={i}
                                onClick={() => handleSelect(i)}
                                disabled={selected !== null}
                                className={`w-full p-4 rounded-xl border ${borderClass} flex items-center justify-between transition-all ${
                                  selected === null
                                    ? "hover:bg-white/10 hover:border-white/10 cursor-pointer"
                                    : ""
                                }`}
                              >
                                <span
                                  className={`text-xs font-bold ${textClass}`}
                                >
                                  {String.fromCharCode(65 + i)}. {opt}
                                </span>
                                {iconEl}
                              </button>
                            );
                          })}
                        </div>

                        <div className="mt-4">
                          {selected !== null ? (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              <button
                                onClick={handleNext}
                                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-indigo-500 text-sm font-bold text-white hover:bg-indigo-400 transition-all cursor-pointer"
                              >
                                {currentQ < quizQuestions.length - 1
                                  ? "Next Question"
                                  : "See Results"}
                                <ChevronRight className="h-3.5 w-3.5" />
                              </button>
                            </motion.div>
                          ) : (
                            <div className="h-[48px]" />
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Project Summary Section */}
      <div className="py-16 bg-slate-50/30">
        <Container>
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Innovative Approach to Lok Sewa.
            </h2>
            <p className="text-base text-slate-500 font-medium leading-relaxed max-w-xl mx-auto">
              LokAI represents a paradigm shift in how government exam
              materials are processed. Our architecture focuses on performance,
              accessibility, and AI integration.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 max-w-lg mx-auto text-left">
              {[
                "AI-Powered Document Intelligence",
                "Institutional RBAC for Ministries",
                "Nepal Constitution Specialized GK",
                "High Performance Architecture",
              ].map((point, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 text-sm text-slate-700 font-semibold"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  {point}
                </div>
              ))}
            </div>
          </div>
        </Container>
      </div>

      {/* Footer */}
      <footer className="py-10 border-t border-slate-50">
        <Container>
          <div className="flex flex-col items-center gap-6">
            <span className="text-sm font-bold tracking-tight text-slate-400">
              LokAI Project Team &copy; 2081
            </span>
            <div className="flex items-center gap-8">
              <Globe2 className="h-4 w-4 text-slate-300 hover:text-slate-900 cursor-pointer transition-colors" />
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
