/**
 * org-documents/[id]/page.tsx — Organization Document Workspace
 * 
 * Provides employees with a premium study environment for corporate documents.
 */

"use client";

import { useState, useEffect, use, useRef, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { QuizPlayer, QuizPlayerQuestion } from "@/components/quiz/QuizPlayer";
import { QuizResultsView } from "@/components/quiz/QuizResultsView";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FullPageSpinner } from "@/components/loading";
import { BackButton } from "@/components/ui/back-button";
import {
  FileText,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Tags,
  Building2,
  HelpCircle,
  Brain,
  Download,
  RefreshCw,
  Loader2,
  Bookmark,
  Play,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DocWorkspace } from "@/components/document/DocWorkspace";
import type { PersonalDocument } from "@/types/database";

interface OrgDocumentDetailData extends PersonalDocument {
  download_url: string | null;
  department_id?: { name: string } | string | null;
  policy_tag?: string | null;
  chapter_tag?: string | null;
  section_tag?: string | null;
}

interface SavedQuiz {
  id: string;
  title: string;
  questions: any[];
  date: string;
}

export default function EmployeeOrgDocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { dbUser, isLoading: authLoading } = useAuth();

  const [doc, setDoc] = useState<OrgDocumentDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [quizResults, setQuizResults] = useState<{
    score: number;
    total: number;
    timeSpent: number;
    questions: Array<{id: string; question: string; options: string[]; correct_answer: number; explanation?: string}>;
    userAnswers: Record<string, number>;
  } | null>(null);

  const [quizHistory, setQuizHistory] = useState<{
    id: string;
    score: number;
    total: number;
    date: string;
    chapter?: string;
  }[]>([]);

  const [savedQuizzes, setSavedQuizzes] = useState<SavedQuiz[]>([]);
  const [chapterSummaries, setChapterSummaries] = useState<Record<number, string>>({});
  const [isMinimized, setIsMinimized] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [selectedChapterIndex, setSelectedChapterIndex] = useState<number>(-1);
  const [activeQuestions, setActiveQuestions] = useState<any[]>([]);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Effects ---

  useEffect(() => {
    // Load local storage states
    const savedH = localStorage.getItem(`org_quiz_history_${id}`);
    if (savedH) try { setQuizHistory(JSON.parse(savedH)); } catch (e) {}

    const savedQ = localStorage.getItem(`org_saved_quizzes_${id}`);
    if (savedQ) try { setSavedQuizzes(JSON.parse(savedQ)); } catch (e) {}

    const savedS = localStorage.getItem(`org_chapter_summaries_${id}`);
    if (savedS) try { setChapterSummaries(JSON.parse(savedS)); } catch (e) {}
  }, [id]);

  useEffect(() => {
    localStorage.setItem(`org_quiz_history_${id}`, JSON.stringify(quizHistory));
  }, [quizHistory, id]);

  useEffect(() => {
    localStorage.setItem(`org_saved_quizzes_${id}`, JSON.stringify(savedQuizzes));
  }, [savedQuizzes, id]);

  useEffect(() => {
    localStorage.setItem(`org_chapter_summaries_${id}`, JSON.stringify(chapterSummaries));
  }, [chapterSummaries, id]);

  const saveToHistory = useCallback((score: number, total: number) => {
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      score,
      total,
      date: new Date().toISOString(),
      chapter: selectedChapterIndex !== -1 ? doc?.chapters?.[selectedChapterIndex]?.title : "Full Doc",
    };
    setQuizHistory(prev => [newItem, ...prev]);
  }, [doc?.chapters, selectedChapterIndex]);

  const handleSaveQuizToLibrary = () => {
    const questionsToSave = activeQuestions.length > 0 ? activeQuestions : (doc?.questions || []);
    if (!questionsToSave || questionsToSave.length === 0) return;
    
    const title = selectedChapterIndex !== -1 ? doc?.chapters?.[selectedChapterIndex]?.title : "Full Doc";
    const newSavedQuiz: SavedQuiz = {
      id: Math.random().toString(36).substr(2, 9),
      title: title || "Organization Quiz",
      questions: [...questionsToSave],
      date: new Date().toISOString()
    };
    setSavedQuizzes(prev => [newSavedQuiz, ...prev]);
    toast.success("Quiz saved!");
  };

  const handleLoadSavedQuiz = (quiz: SavedQuiz) => {
    setActiveQuestions(quiz.questions);
    setQuizResults(null);
    toast.success(`Loaded: ${quiz.title}`);
  };

  const handleDeleteSavedQuiz = (qId: string) => {
    setSavedQuizzes(prev => prev.filter(q => q.id !== qId));
    toast.info("Removed from library");
  };

  const fetchDoc = useCallback(async () => {
    try {
      const res = await fetch(`/api/org/documents/${id}`);
      if (res.ok) {
        const data = await res.json();
        setDoc(data);
        if (data.questions && activeQuestions.length === 0) {
          setActiveQuestions(data.questions);
        }
        if (data.processing_status === "completed" && pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
      }
    } catch (err) {}
    setLoading(false);
  }, [id, activeQuestions.length]);

  useEffect(() => { fetchDoc(); }, [fetchDoc]);

  const handleQuizSubmit = async (answers: Record<string, number>, timeSpent: number) => {
    try {
      const res = await fetch(`/api/org/documents/${id}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, time_spent: timeSpent }),
      });
      if (res.ok) {
        const resultData = await res.json();
        setQuizResults({
          score: resultData.score,
          total: resultData.total,
          timeSpent: timeSpent,
          questions: (resultData.results || []).map((r: any) => ({
            id: r.id, question: r.question, options: r.options,
            correct_answer: r.correct_answer, explanation: r.explanation,
          })),
          userAnswers: (resultData.results || []).reduce((acc: Record<string, number>, r: any) => {
            if (r.user_answer !== undefined) acc[r.id] = r.user_answer;
            return acc;
          }, {} as Record<string, number>),
        });
        toast.success(`Scored ${resultData.score} / ${resultData.total}`);
      }
    } catch { toast.error("Submit failed"); }
  };

  const handleSummarize = async () => {
    setSummarizing(true);
    try {
      const isChapter = selectedChapterIndex !== -1;
      const textToSummarize = isChapter
        ? doc?.chapters?.[selectedChapterIndex]?.content
        : doc?.extracted_text;

      toast.info("Processing chapter summary...");

      const res = await fetch(`/api/org/documents/${id}/summarize`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engine: "groq",
          text: isChapter ? textToSummarize : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (!isChapter) {
          setDoc((prev) => (prev ? { ...prev, ai_summary: data.summary } : prev));
          toast.success("Summary updated!");
        } else {
          setChapterSummaries(prev => ({ ...prev, [selectedChapterIndex]: data.summary }));
          toast.success("Chapter summary ready!");
        }
      }
    } catch (err) { toast.error("Summarization failed"); } finally {
      setSummarizing(false);
    }
  };

  if (authLoading || loading) return <FullPageSpinner />;

  if (!dbUser || !doc) {
    return (
      <div className="p-12 text-center py-24 space-y-6">
        <FileText className="h-16 w-16 text-slate-200 mx-auto" />
        <h2 className="text-xl font-black">Document Locked or Not Found</h2>
        <BackButton />
      </div>
    );
  }

  const isReady = doc.processing_status === "completed";

  const quizElement = (
    <div className="space-y-6">
        <div className="bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-500/20">
                        <Brain size={16} />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-orange-600 dark:text-orange-400">
                        Quiz
                    </h3>
                </div>
                {activeQuestions.length > 0 && !quizResults && (
                   <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleSaveQuizToLibrary}
                    className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-orange-600"
                  >
                    <Bookmark className="h-3 w-3 mr-2" />
                    Save Quiz
                  </Button>
                )}
            </div>

            {quizResults ? (
                <QuizResultsView
                    score={quizResults.score}
                    total={quizResults.total}
                    timeSpent={quizResults.timeSpent}
                    questions={quizResults.questions}
                    userAnswers={quizResults.userAnswers}
                    title={doc.title}
                    onRetake={() => {
                        saveToHistory(quizResults.score, quizResults.total);
                        setQuizResults(null);
                    }}
                />
            ) : isReady && activeQuestions.length > 0 ? (
                <QuizPlayer 
                    questions={(activeQuestions as QuizPlayerQuestion[])}
                    title="Active Quiz"
                    showStartScreen={true}
                    onSubmit={handleQuizSubmit}
                />
            ) : (
                <div className="text-center py-12 space-y-4">
                    <Brain className="h-12 w-12 text-slate-300 mx-auto opacity-40" />
                    <p className="text-sm font-medium text-slate-400">Policy quiz arriving soon.</p>
                </div>
            )}
        </div>

        {savedQuizzes.length > 0 && (
          <div className="bg-white/40 dark:bg-slate-900/40 rounded-2xl p-6 border border-white/20 dark:border-white/5 backdrop-blur-sm">
             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
               <Bookmark size={12} /> Saved Library
             </h4>
             <div className="grid gap-3">
                {savedQuizzes.map((quiz) => (
                  <div key={quiz.id} className="flex items-center justify-between p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-white/10">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase truncate">{quiz.title}</span>
                      <span className="text-[9px] text-slate-400">{quiz.questions.length} Items</span>
                    </div>
                    <div className="flex items-center gap-2 text-indigo-500">
                      <Button variant="ghost" size="icon" onClick={() => handleLoadSavedQuiz(quiz)} className="h-8 w-8 rounded-lg bg-indigo-500/10 hover:bg-indigo-500 hover:text-white transition-all">
                        <Play size={14} fill="currentColor" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteSavedQuiz(quiz.id)} className="h-8 w-8 rounded-lg text-slate-300">
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {quizHistory.length > 0 && (
          <div className="bg-white/40 dark:bg-slate-900/40 rounded-2xl p-6 border border-white/20 dark:border-white/5 backdrop-blur-sm shadow-sm">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
              <Clock size={12} /> History
            </h4>
            <div className="space-y-3">
              {quizHistory.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-white/10">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-500 uppercase truncate max-w-[120px]">{item.chapter}</span>
                    <span className="text-[9px] text-slate-400">{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                  <div className="px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-black">
                    {item.score} / {item.total}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );

  return (
    <div className="p-4 sm:p-8 max-w-[1600px] mx-auto min-h-screen">
      <DocWorkspace 
        doc={doc} 
        quizElement={quizElement}
        chapterSummaries={chapterSummaries}
        onChapterSelect={(idx) => setSelectedChapterIndex(idx)}
        onSummarize={handleSummarize}
        isMinimized={isMinimized}
        onMinimizeToggle={() => setIsMinimized(!isMinimized)}
      />
    </div>
  );
}
