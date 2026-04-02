"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  BookOpen, Plus, Send, CheckCircle2, AlertCircle,
  Image, Tag, Clock, Star, Layers, Braces, Eye, EyeOff
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
}

interface GlobalQuiz {
  id: string;
  title: string;
  description: string;
  category: string;
  sub_category: string | null;
  difficulty: string;
  questions: QuizQuestion[];
  total_questions: number;
  time_limit_minutes: number;
  reward_xp: number;
  thumbnail_url: string | null;
  is_active: boolean;
  created_at: string;
}

const CATEGORY_OPTIONS = [
  "Nepal Constitution",
  "Geography",
  "History",
  "Current Affairs",
  "General Knowledge",
  "Science & Technology",
  "Economy",
  "Politics",
];

const QUESTION_TEMPLATE = JSON.stringify([
  {
    id: "q_1",
    question: "Sample question text?",
    options: ["Option A", "Option B", "Option C", "Option D"],
    correct_answer: 0,
    explanation: "Brief explanation of why Option A is correct."
  }
], null, 2);

const difficultyColor: Record<string, string> = {
  easy: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  medium: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  hard: "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
};

export default function GlobalQuizManagerPage() {
  const [quizzes, setQuizzes] = useState<GlobalQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState("15");
  const [rewardXp, setRewardXp] = useState("50");
  const [jsonInput, setJsonInput] = useState(QUESTION_TEMPLATE);

  // JSON Validation state
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonQuestionCount, setJsonQuestionCount] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const fetchQuizzes = useCallback(async () => {
    try {
      const res = await fetch("/api/super/quizzes");
      if (res.ok) setQuizzes(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQuizzes(); }, [fetchQuizzes]);

  function validateJson(value: string) {
    setJsonInput(value);
    try {
      const parsed = JSON.parse(value);
      const arr = Array.isArray(parsed) ? parsed : [parsed];

      // Schema check
      for (const q of arr) {
        if (!q.id || !q.question || !Array.isArray(q.options) || q.correct_answer === undefined) {
          setJsonError("Each question needs: id, question, options[], correct_answer (and optionally explanation)");
          setJsonQuestionCount(null);
          return;
        }
        if (q.options.length < 2) {
          setJsonError("Each question must have at least 2 options.");
          setJsonQuestionCount(null);
          return;
        }
      }
      setJsonError(null);
      setJsonQuestionCount(arr.length);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Invalid JSON";
      setJsonError(msg);
      setJsonQuestionCount(null);
    }
  }

  function formatJson() {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed, null, 2));
      setJsonError(null);
      toast.success("JSON formatted successfully.");
    } catch {
      toast.error("Cannot format: JSON is malformed.");
    }
  }

  function resetForm() {
    setTitle(""); setDescription(""); setCategory(""); setSubCategory("");
    setDifficulty("medium"); setThumbnailUrl(""); setTimeLimitMinutes("15");
    setRewardXp("50"); setJsonInput(QUESTION_TEMPLATE);
    setJsonError(null); setJsonQuestionCount(null); setShowPreview(false);
  }

  async function handlePushQuiz() {
    if (!title.trim()) { toast.error("Quiz title is required."); return; }
    if (!category) { toast.error("Topic (category) is required."); return; }
    if (jsonError) { toast.error("Fix JSON errors before publishing."); return; }

    let parsedQuestions: QuizQuestion[] = [];
    try {
      const raw = JSON.parse(jsonInput);
      parsedQuestions = Array.isArray(raw) ? raw : [raw];
    } catch {
      toast.error("Questions JSON is invalid."); return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/super/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          sub_category: subCategory.trim() || "General",
          difficulty,
          thumbnail_url: thumbnailUrl.trim() || null,
          time_limit_minutes: parseInt(timeLimitMinutes) || 15,
          reward_xp: parseInt(rewardXp) || 0,
          questions: parsedQuestions,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to publish quiz.");
      }
      toast.success("Quiz published globally! 🎉");
      setOpen(false);
      resetForm();
      fetchQuizzes();
    } catch (e: unknown) {
      if (e instanceof Error) toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-indigo-600 p-3 text-white shadow-lg shadow-indigo-200">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">Global Quiz Manager</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Publish GK quizzes with rich topics, chapters, and visual thumbnails.
            </p>
          </div>
        </div>

        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200/50 h-11 px-6 font-bold rounded-xl">
              <Plus className="mr-2 h-4 w-4" /> Create New Quiz
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-black tracking-tight">Publish New Global Quiz</DialogTitle>
              <DialogDescription>
                This quiz will immediately be visible to all platform users.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-2">
              {/* Section: Identity */}
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5" /> Identity & Hierarchy
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Title *</label>
                    <Input placeholder="e.g. Fundamental Rights: Part 1" value={title} onChange={e => setTitle(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Topic (Category) *</label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger><SelectValue placeholder="Select topic…" /></SelectTrigger>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Sub-Topic (Chapter)</label>
                    <Input placeholder="e.g. Fundamental Rights & Duties" value={subCategory} onChange={e => setSubCategory(e.target.value)} />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Description</label>
                    <Input placeholder="Brief summary of what this quiz covers…" value={description} onChange={e => setDescription(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Section: Configuration */}
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5" /> Configuration
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Difficulty</label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" /> Time Limit (min)
                    </label>
                    <Input type="number" min="1" value={timeLimitMinutes} onChange={e => setTimeLimitMinutes(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 text-slate-400" /> Reward XP
                    </label>
                    <Input type="number" min="0" value={rewardXp} onChange={e => setRewardXp(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Section: Visual */}
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Image className="h-3.5 w-3.5" /> Thumbnail Image
                </p>
                <div className="flex gap-3 items-start">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Image URL</label>
                    <Input
                      placeholder="https://images.unsplash.com/photo-…?auto=format&fit=crop&w=400"
                      value={thumbnailUrl}
                      onChange={e => setThumbnailUrl(e.target.value)}
                    />
                    <p className="text-[11px] text-slate-400">Leave blank to use the default category image. Supports any public image URL.</p>
                  </div>
                  {thumbnailUrl && (
                    <div className="h-20 w-28 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-slate-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumbnailUrl} alt="Preview" className="h-full w-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                    </div>
                  )}
                </div>
              </div>

              {/* Section: Questions JSON */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Braces className="h-3.5 w-3.5" /> Questions Array (JSON)
                    {jsonQuestionCount !== null && !jsonError && (
                      <span className="text-indigo-600 font-black">{jsonQuestionCount} Questions</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowPreview(p => !p)}>
                      {showPreview ? <EyeOff className="h-3.5 w-3.5 mr-1" /> : <Eye className="h-3.5 w-3.5 mr-1" />}
                      {showPreview ? "Edit" : "Preview"}
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={formatJson}>
                      Format JSON
                    </Button>
                  </div>
                </div>

                {/* Schema hint */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[11px] font-mono text-slate-500 leading-relaxed">
                  Required fields per question: <span className="text-indigo-600 font-bold">id</span>, <span className="text-indigo-600 font-bold">question</span>, <span className="text-indigo-600 font-bold">options[]</span>, <span className="text-indigo-600 font-bold">correct_answer</span> (0-indexed integer)<br />
                  Optional: <span className="text-slate-400">explanation</span>
                </div>

                {showPreview ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {(() => {
                      try {
                        const arr = JSON.parse(jsonInput);
                        const questions = (Array.isArray(arr) ? arr : [arr]) as QuizQuestion[];
                        return questions.map((q: QuizQuestion, i: number) => (
                          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-2">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{i + 1}. {q.question || ""}</p>
                            <div className="grid grid-cols-2 gap-1.5">
                              {(q.options || []).map((opt, j) => (
                                <div key={j} className={cn("text-xs px-2 py-1.5 rounded-lg border font-medium",
                                  j === Number(q.correct_answer)
                                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400"
                                    : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                                )}>
                                  {String.fromCharCode(65 + j)}. {opt}
                                </div>
                              ))}
                            </div>
                            {!!q.explanation && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic border-t border-slate-100 dark:border-slate-700 pt-2">{q.explanation}</p>
                            )}
                          </div>
                        ));
                      } catch {
                        return <p className="text-sm text-red-500 text-center py-4">Fix JSON errors to preview</p>;
                      }
                    })()}
                  </div>
                ) : (
                  <Textarea
                    className={cn(
                      "font-mono text-xs h-56 resize-none border transition-colors",
                      jsonError ? "border-red-300 focus-visible:ring-red-200" : "border-slate-200"
                    )}
                    value={jsonInput}
                    onChange={e => validateJson(e.target.value)}
                    spellCheck={false}
                  />
                )}

                {/* Validation feedback */}
                {jsonError ? (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600 font-medium">{jsonError}</p>
                  </div>
                ) : jsonQuestionCount !== null ? (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <p className="text-xs text-emerald-700 font-medium">
                      Valid — {jsonQuestionCount} question{jsonQuestionCount !== 1 ? "s" : ""} ready to publish.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            <DialogFooter className="gap-3 pt-2 border-t border-slate-100">
              <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
              <Button
                onClick={handlePushQuiz}
                disabled={submitting || !!jsonError}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6"
              >
                {submitting ? (
                  <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Publishing…</span>
                ) : (
                  <span className="flex items-center gap-2"><Send className="h-4 w-4" /> Push to All Users</span>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Quizzes", value: quizzes.length, color: "text-indigo-600" },
          { label: "Active", value: quizzes.filter(q => q.is_active).length, color: "text-emerald-600" },
          { label: "Total Questions", value: quizzes.reduce((s, q) => s + (q.total_questions || 0), 0), color: "text-amber-600" },
          { label: "Topics Covered", value: new Set(quizzes.map(q => q.category)).size, color: "text-slate-600" },
        ].map(stat => (
          <Card key={stat.label} className="border border-slate-200 shadow-none">
            <CardContent className="p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{stat.label}</p>
              <p className={`text-3xl font-black tracking-tighter mt-1 ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quiz Table */}
      <Card className="border border-slate-200 dark:border-slate-700 shadow-none overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-700 px-6 py-4">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Published Quizzes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/70 dark:bg-slate-800/70">
                <TableHead className="pl-6 font-black text-slate-500 text-[10px] uppercase tracking-widest">Quiz</TableHead>
                <TableHead className="font-black text-slate-500 text-[10px] uppercase tracking-widest">Topic / Chapter</TableHead>
                <TableHead className="font-black text-slate-500 text-[10px] uppercase tracking-widest">Difficulty</TableHead>
                <TableHead className="font-black text-slate-500 text-[10px] uppercase tracking-widest">Qs</TableHead>
                <TableHead className="font-black text-slate-500 text-[10px] uppercase tracking-widest">XP</TableHead>
                <TableHead className="font-black text-slate-500 text-[10px] uppercase tracking-widest">Thumbnail</TableHead>
                <TableHead className="font-black text-slate-500 text-[10px] uppercase tracking-widest">Published</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7} className="h-14">
                      <div className="h-4 w-full rounded-lg bg-slate-100 dark:bg-slate-700 animate-pulse" />
                    </TableCell>
                  </TableRow>
                ))
              ) : quizzes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-400 h-32 font-medium">
                    No quizzes published yet. Click "Create New Quiz" to get started.
                  </TableCell>
                </TableRow>
              ) : (
                quizzes.map(quiz => (
                  <TableRow key={quiz.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        {quiz.thumbnail_url && (
                          <div className="h-10 w-14 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={quiz.thumbnail_url} alt="" className="h-full w-full object-cover" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{quiz.title}</p>
                          {quiz.description && (
                            <p className="text-xs text-slate-400 line-clamp-1">{quiz.description}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-indigo-200 text-indigo-700 bg-indigo-50">
                          {quiz.category}
                        </Badge>
                        {quiz.sub_category && quiz.sub_category !== "General" && (
                          <p className="text-[11px] text-slate-400 font-medium">{quiz.sub_category}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-[10px] font-black uppercase tracking-widest border capitalize", difficultyColor[quiz.difficulty] || difficultyColor.medium)}>
                        {quiz.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono font-bold text-slate-700 dark:text-slate-300">{quiz.total_questions}</TableCell>
                    <TableCell className="font-mono font-bold text-amber-600">{quiz.reward_xp > 0 ? `+${quiz.reward_xp}` : "—"}</TableCell>
                    <TableCell>
                      {quiz.thumbnail_url ? (
                        <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Set
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Default</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-slate-400 font-medium">
                      {format(new Date(quiz.created_at), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
