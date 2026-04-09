/**
 * dashboard/documents/[id]/page.tsx — Personal Document Detail
 *
 * Shows full document metadata, download link, processing status,
 * extracted text preview, and on-demand AI actions (Summarize / Generate Quiz).
 */

"use client";

import { useState, useEffect, useRef, use, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { QuizPlayer } from "@/components/quiz/QuizPlayer";
import { QuizResultsView } from "@/components/quiz/QuizResultsView";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { FullPageSpinner } from "@/components/loading";
import { BackButton } from "@/components/ui/back-button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  Check,
  XIcon,
  Clock,
  AlertCircle,
  Sparkles,
  Loader2,
  Copy,
  RefreshCw,
  Brain,
  FileText,
  Download,
  Trash2,
  Tags,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Play,
  Cpu,
  Zap,
  Settings,
  List,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DocWorkspace } from "@/components/document/DocWorkspace";
import type { PersonalDocument, DocumentProcessingStatus } from "@/types/database";

// --- HELPERS ---

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${((bytes / 1024)).toFixed(1)} KB`;
  return `${((bytes / (1024 * 1024))).toFixed(1)} MB`;
}

const statusLabels: Record<DocumentProcessingStatus, string> = {
  pending: "Ready to Extract",
  processing: "Extracting...",
  completed: "Analyzed",
  failed: "Failed",
};

interface DocumentDetailData extends PersonalDocument {
  download_url: string | null;
}

interface GeneratedQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}

interface SavedQuiz {
  id: string;
  title: string;
  questions: GeneratedQuestion[];
  date: string;
}

// --- MAIN COMPONENT ---

export default function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();

  const [doc, setDoc] = useState<DocumentDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [summarizing, setSummarizing] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [quizResults, setQuizResults] = useState<{
    score: number;
    total: number;
    timeSpent: number;
    userAnswers: Record<string, number>;
  } | null>(null);

  const [quizCount, setQuizCount] = useState(10);
  const [quizDifficulty, setQuizDifficulty] = useState("medium");

  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrEta, setOcrEta] = useState<number | null>(null);
  const [modelPreference, setModelPreference] = useState<"local" | "groq">("groq");
  const [selectedChapterIndex, setSelectedChapterIndex] = useState<number>(-1);

  const [quizHistory, setQuizHistory] = useState<{
    id: string;
    score: number;
    total: number;
    date: string;
    chapter?: string;
  }[]>([]);

  const [savedQuizzes, setSavedQuizzes] = useState<SavedQuiz[]>([]);
  const [chapterSummaries, setChapterSummaries] = useState<Record<number, string>>({}); // NEW
  const [isMinimized, setIsMinimized] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Effects ---

  useEffect(() => {
    // Load state from LocalStorage
    const savedH = localStorage.getItem(`quiz_history_${id}`);
    if (savedH) try { setQuizHistory(JSON.parse(savedH)); } catch (e) {}

    const savedQ = localStorage.getItem(`saved_quizzes_${id}`);
    if (savedQ) try { setSavedQuizzes(JSON.parse(savedQ)); } catch (e) {}

    const savedS = localStorage.getItem(`chapter_summaries_${id}`);
    if (savedS) try { setChapterSummaries(JSON.parse(savedS)); } catch (e) {}
  }, [id]);

  useEffect(() => {
    localStorage.setItem(`quiz_history_${id}`, JSON.stringify(quizHistory));
  }, [quizHistory, id]);

  useEffect(() => {
    localStorage.setItem(`saved_quizzes_${id}`, JSON.stringify(savedQuizzes));
  }, [savedQuizzes, id]);

  useEffect(() => {
    localStorage.setItem(`chapter_summaries_${id}`, JSON.stringify(chapterSummaries));
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
    if (questions.length === 0) return;
    const title = selectedChapterIndex !== -1 ? doc?.chapters?.[selectedChapterIndex]?.title : "Full Doc";
    const newSavedQuiz: SavedQuiz = {
      id: Math.random().toString(36).substr(2, 9),
      title: title || "Document Questions",
      questions: [...questions],
      date: new Date().toISOString()
    };
    setSavedQuizzes(prev => [newSavedQuiz, ...prev]);
    toast.success("Quiz saved!");
  };

  const handleLoadSavedQuiz = (quiz: SavedQuiz) => {
    setQuestions(quiz.questions);
    setQuizResults(null);
    toast.success(`Loaded quiz: ${quiz.title}`);
  };

  const handleDeleteSavedQuiz = (qId: string) => {
    setSavedQuizzes(prev => prev.filter(q => q.id !== qId));
    toast.info("Removed from library");
  };

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/documents/${id}`);
        if (res.ok) {
          const data = await res.json();
          setDoc(data);
          setEditTitle(data.title);
          setEditDescription(data.description || "");
          if (data.questions && Array.isArray(data.questions)) {
            setQuestions(data.questions);
          }
        } else {
          setLoadError(`Document fetch failed.`);
        }
      } catch (err) {
        setLoadError("Network error.");
      }
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const startPolling = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/documents/${id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.processing_status === "completed") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = null;
          setDoc(data);
          if (data.questions && Array.isArray(data.questions)) {
            setQuestions(data.questions);
          }
          toast.success("Processing complete!");
        } else if (data.processing_status === "failed") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = null;
          setDoc(data);
          toast.error("Processing failed.");
        }
      } catch {}
    }, 5000);
  }, [id]);

  useEffect(() => {
    if (doc && (doc.processing_status === "processing" || doc.processing_status === "pending")) {
      startPolling();
    }
  }, [doc?.processing_status, startPolling]);

  // --- Handlers ---

  async function handleStartOCR() {
    setDoc((prev) => prev ? { ...prev, processing_status: "processing", processing_error: null } : prev);
    try {
      const res = await fetch(`/api/documents/${id}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ engine_preference: modelPreference }),
      });
      if (res.ok) {
        toast.info(`Processing started...`);
        startPolling();
      }
    } catch (err) {}
  }

  async function handleSummarize() {
    setSummarizing(true);
    try {
      const isChapter = selectedChapterIndex !== -1;
      const textToSummarize = isChapter
        ? doc?.chapters?.[selectedChapterIndex]?.content
        : doc?.extracted_text;

      const res = await fetch(`/api/documents/${id}/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engine: modelPreference,
          text: isChapter ? textToSummarize : undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (!isChapter) {
          setDoc((prev) => (prev ? { ...prev, ai_summary: data.summary } : prev));
          toast.success("Full summary updated!");
        } else {
          // Store chapter summary in local state
          setChapterSummaries(prev => ({ ...prev, [selectedChapterIndex]: data.summary }));
          toast.success("Chapter summary generated!");
        }
      } else {
        toast.error("Summarization failed.");
      }
    } catch (err: any) {
      toast.error("Summarization failed.");
    } finally {
      setSummarizing(false);
    }
  }

  async function handleGenerateQuiz() {
    setGeneratingQuiz(true);
    try {
      const isChapter = selectedChapterIndex !== -1;
      const textToProcess = isChapter
        ? doc?.chapters?.[selectedChapterIndex]?.content
        : doc?.extracted_text;

      const res = await fetch(`/api/documents/${id}/generate-questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: quizCount,
          difficulty: quizDifficulty,
          engine: modelPreference,
          text: isChapter ? textToProcess : undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const newQuestions = data.questions || [];
        setQuestions(newQuestions);
        toast.success("New quiz ready!");
      }
    } catch (err: any) {} finally {
      setGeneratingQuiz(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Deleted.");
        router.push("/dashboard/documents");
      }
    } catch {} finally {
      setDeleting(false);
      setShowDelete(false);
    }
  }

  const isReady = !!doc?.extracted_text;
  const isProcessing = doc?.processing_status === "processing";

  if (authLoading || loading) return <FullPageSpinner />;

  if (!doc) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-black mb-4">Document Not Found</h2>
        <div className="flex gap-4">
          <BackButton />
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="rounded-xl border-slate-200 dark:border-slate-800 font-bold"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  // --- Workspace Components ---
  const quizPlayer = (
    <div className="space-y-6">
      <div className="bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
        <div className="flex flex-col gap-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-500/20">
                <Brain size={16} />
              </div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-orange-600 dark:text-orange-400">
                  Quiz
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {questions.length > 0 && !quizResults && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSaveQuizToLibrary}
                  className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-orange-600"
                >
                  <Bookmark className="h-3 w-3 mr-2" />
                  Save To Library
                </Button>
              )}
              <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerateQuiz}
                  disabled={generatingQuiz}
                  className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-600"
              >
                  {generatingQuiz ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <RefreshCw className="h-3 w-3 mr-2" />}
                  {questions.length > 0 ? "Re-Generate" : "Generate Quiz"}
              </Button>
            </div>
          </div>

          {!quizResults && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <List size={12} /> Questions: {quizCount}
                </label>
                <Slider
                  value={[quizCount]}
                  min={5}
                  max={20}
                  step={1}
                  onValueChange={([val]) => setQuizCount(val)}
                  className="py-2"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Settings size={12} /> Difficulty
                </label>
                <Select value={quizDifficulty} onValueChange={setQuizDifficulty}>
                  <SelectTrigger className="h-8 text-[10px] font-bold uppercase tracking-widest bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy" className="text-[10px] font-bold uppercase tracking-widest">Easy</SelectItem>
                    <SelectItem value="medium" className="text-[10px] font-bold uppercase tracking-widest">Medium</SelectItem>
                    <SelectItem value="hard" className="text-[10px] font-bold uppercase tracking-widest">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {quizResults ? (
          <div>
            <QuizResultsView
              score={quizResults.score}
              total={quizResults.total}
              timeSpent={quizResults.timeSpent}
              questions={questions}
              userAnswers={quizResults.userAnswers}
              title={doc.title}
              onRetake={() => setQuizResults(null)}
            />
          </div>
        ) : questions.length > 0 ? (
          <QuizPlayer
            questions={questions}
            onSubmit={async (answers, timeSpent) => {
              const correct = questions.reduce((acc, q) => acc + (answers[q.id] === q.correct_answer ? 1 : 0), 0);
              setQuizResults({ score: correct, total: questions.length, timeSpent, userAnswers: answers });
              toast.success(`Scored ${correct} / ${questions.length}`);
            }}
            title="Active Quiz"
            showStartScreen={true}
          />
        ) : (
          <div className="text-center py-12 space-y-4">
             <div className="p-6 rounded-full bg-slate-100 dark:bg-slate-800 w-20 h-20 flex items-center justify-center mx-auto opacity-40">
                <Brain className="h-10 w-10" />
             </div>
             <p className="text-sm font-bold text-slate-400">No active quiz.</p>
             <Button
                onClick={handleGenerateQuiz}
                disabled={generatingQuiz}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-6 rounded-xl shadow-lg"
             >
                Generate Quiz
             </Button>
          </div>
        )}
      </div>

      {savedQuizzes.length > 0 && (
        <div className="bg-white/40 dark:bg-slate-900/40 rounded-2xl p-6 border border-white/20 dark:border-white/5 backdrop-blur-sm shadow-sm">
           <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
             <Bookmark size={12} /> Quiz Library
           </h4>
           <div className="grid gap-3">
              {savedQuizzes.map((quiz) => (
                <div key={quiz.id} className="flex items-center justify-between p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-white/10">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase truncate">{quiz.title}</span>
                    <span className="text-[9px] text-slate-400">{quiz.questions.length} Items • {new Date(quiz.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleLoadSavedQuiz(quiz)} className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600">
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
    </div>
  );

  return (
    <TooltipProvider>
      <div className="p-4 sm:p-8 max-w-[1600px] mx-auto min-h-screen bg-white dark:bg-slate-950">
        {/* Header Title Section */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BackButton />
            <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block" />
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-3">
                <FileText className="h-6 w-6 text-indigo-500" />
                {doc.title}
              </h1>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="capitalize bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-none font-bold text-[10px] uppercase tracking-widest px-2.5 py-0.5">
                  {statusLabels[doc.processing_status]}
                </Badge>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  Added {new Date(doc.created_at).toLocaleDateString()}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => window.location.reload()}
                  className="h-7 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg ml-2"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger
                onClick={() => setShowDelete(true)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all focus:outline-none"
              >
                <Trash2 className="h-4 w-4" />
              </TooltipTrigger>
              <TooltipContent>Delete Document</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {!isReady ? (
          <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-20 text-center space-y-8">
             <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
               {isProcessing ? <Loader2 className="h-10 w-10 animate-spin" /> : <FileText className="h-10 w-10" />}
             </div>
             <div>
                <h2 className="text-2xl font-black mb-2">{isProcessing ? "Extracting Text..." : "Document Uploaded"}</h2>
                <p className="text-slate-500 max-w-sm mx-auto">
                  {isProcessing 
                    ? "Our AI is currently reading your document. This might take a moment..." 
                    : "Your document is ready. Choose your AI engine and start your analysis."}
                </p>
              </div>

              {!isProcessing && (
                <div className="flex flex-col items-center gap-6">
                  <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-inner">
                    <button
                      onClick={() => setModelPreference("local")}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all duration-200 font-bold text-xs uppercase tracking-widest",
                        modelPreference === "local"
                          ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-md scale-[1.02]"
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      )}
                    >
                      <Cpu className="h-4 w-4" />
                      Local Transformer
                    </button>
                    <button
                      onClick={() => setModelPreference("groq")}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all duration-200 font-bold text-xs uppercase tracking-widest",
                        modelPreference === "groq"
                          ? "bg-white dark:bg-slate-700 text-orange-600 shadow-md scale-[1.02]"
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      )}
                    >
                      <Zap className="h-4 w-4" />
                      Groq AI (Fast)
                    </button>
                  </div>

                  <Button 
                    onClick={handleStartOCR} 
                    className="bg-indigo-600 hover:bg-indigo-700 h-14 px-10 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-500/20 active:scale-95 transition-all w-full max-w-md"
                  >
                    Start Analysis
                  </Button>
                  
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    {modelPreference === "local" 
                      ? "Privacy First: Processing stays on your local server" 
                      : "Speed First: High-performance cloud intelligence"}
                  </p>
                </div>
             )}
          </div>
      ) : (
          <DocWorkspace 
            doc={doc} 
            quizElement={quizPlayer}
            chapterSummaries={chapterSummaries}
            onChapterSelect={(idx) => setSelectedChapterIndex(idx)}
            onSummarize={handleSummarize}
            isMinimized={isMinimized}
            onMinimizeToggle={() => setIsMinimized(!isMinimized)}
          />
      )}

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent className="rounded-3xl p-8 border-none shadow-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black">Delete Document?</AlertDialogTitle>
            <AlertDialogDescription className="font-medium">
              This will permanently remove &quot;{doc.title}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 pt-4">
            <AlertDialogCancel disabled={deleting} className="rounded-2xl h-12 px-6 font-bold border-slate-200">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white rounded-2xl h-12 px-8 font-bold shadow-none"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </TooltipProvider>
  );
}


