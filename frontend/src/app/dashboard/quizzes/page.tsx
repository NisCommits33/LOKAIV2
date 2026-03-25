/**
 * dashboard/quizzes/page.tsx — GK Quiz Listing
 *
 * Displays available GK quizzes in a card grid with:
 * - Category filter chips
 * - Difficulty filter
 * - Search bar
 * - Quiz cards with title, category badge, difficulty badge, question count, time limit
 *
 * @module app/dashboard/quizzes
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FullPageSpinner } from "@/components/loading";
import {
  BookOpen,
  Search,
  Clock,
  HelpCircle,
  History,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { GKQuiz, QuizDifficulty } from "@/types/database";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

/** All available categories for filtering */
const CATEGORIES = [
  "All",
  "Nepal Constitution",
  "Geography",
  "History",
  "Current Affairs",
];

/** Difficulty badge color mapping */
const difficultyColors: Record<QuizDifficulty, string> = {
  easy: "bg-emerald-50 text-emerald-700 border-emerald-100",
  medium: "bg-amber-50 text-amber-700 border-amber-100",
  hard: "bg-red-50 text-red-700 border-red-100",
};

export default function QuizzesPage() {
  const { isLoading: authLoading } = useAuth();
  const [quizzes, setQuizzes] = useState<GKQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [difficulty, setDifficulty] = useState<QuizDifficulty | "">("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchQuizzes() {
      setLoading(true);
      const params = new URLSearchParams();
      if (category !== "All") params.set("category", category);
      if (difficulty) params.set("difficulty", difficulty);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/gk/quizzes?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data);
      }
      setLoading(false);
    }
    const timer = setTimeout(fetchQuizzes, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [category, difficulty, search]);

  if (authLoading) return <FullPageSpinner />;

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            GK Quizzes
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Practice general knowledge for your Lok Sewa exams
          </p>
        </div>
        <Link href="/dashboard/quizzes/history">
          <Button variant="outline" size="sm" className="gap-2">
            <History className="h-4 w-4" />
            Quiz History
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search quizzes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-white"
        />
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat}
            variant={category === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setCategory(cat)}
            className={
              category === cat
                ? "bg-slate-900 text-white"
                : "text-slate-600"
            }
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Difficulty filter */}
      <div className="flex gap-2">
        {(["easy", "medium", "hard"] as QuizDifficulty[]).map((d) => (
          <Button
            key={d}
            variant="outline"
            size="sm"
            onClick={() => setDifficulty(difficulty === d ? "" : d)}
            className={
              difficulty === d
                ? difficultyColors[d] + " border font-semibold"
                : "text-slate-500"
            }
          >
            {d.charAt(0).toUpperCase() + d.slice(1)}
          </Button>
        ))}
      </div>

      {/* Quiz grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <BookOpen className="h-10 w-10 text-slate-300 mx-auto" />
          <p className="text-slate-500 font-medium">No quizzes found</p>
          <p className="text-sm text-slate-400">
            Try adjusting your filters or search term
          </p>
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {quizzes.map((quiz) => (
            <motion.div key={quiz.id} variants={item}>
              <Link href={`/dashboard/quizzes/${quiz.id}`}>
                <Card className="shadow-none border border-slate-100 overflow-hidden bg-white hover:border-slate-200 transition-colors cursor-pointer group">
                  <CardContent className="p-5 space-y-4">
                    {/* Category + difficulty badges */}
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

                    {/* Title & description */}
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                        {quiz.title}
                      </h3>
                      {quiz.description && (
                        <p className="text-xs text-slate-500 font-medium line-clamp-2">
                          {quiz.description}
                        </p>
                      )}
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <HelpCircle className="h-3.5 w-3.5" />
                        {quiz.total_questions} questions
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {quiz.time_limit_minutes} min
                      </span>
                    </div>

                    {/* Start button */}
                    <div className="flex justify-end">
                      <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                        Start Quiz
                        <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
