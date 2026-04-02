/**
 * dashboard/documents/[id]/page.tsx — Personal Document Detail
 *
 * Shows full document metadata, download link, processing status,
 * extracted text preview, and on-demand AI actions (Summarize / Generate Quiz).
 *
 * Layout matches the admin document detail pattern:
 * - Tab-based right column (Play Quiz, Summary, Raw Text)
 * - Collapsible AI Actions panel in left sidebar
 * - Clean processing setup card when not ready
 *
 * @module app/dashboard/documents/[id]
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
import { FullPageSpinner } from "@/components/loading";
import { BackButton } from "@/components/ui/back-button";
import { Progress } from "@/components/ui/progress";
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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { PersonalDocument, DocumentProcessingStatus } from "@/types/database";

// --- HELPERS ---

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusColors: Record<DocumentProcessingStatus, string> = {
  pending: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800",
  processing: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-800",
  completed: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800",
  failed: "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800",
};

const statusLabels: Record<DocumentProcessingStatus, string> = {
  pending: "Pending",
  processing: "Extracting text...",
  completed: "Ready",
  failed: "Extraction Failed",
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

  const [quizCount, setQuizCount] = useState(5);
  const [quizDifficulty, setQuizDifficulty] = useState("medium");

  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrEta, setOcrEta] = useState<number | null>(null);
  const [modelPreference, setModelPreference] = useState<"local" | "groq">("groq");
  const [selectedChapterIndex, setSelectedChapterIndex] = useState<number>(-1);

  // Collapsible section states
  const [showAI, setShowAI] = useState(true);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Effects ---

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
          const errorText = await res.text();
          setLoadError(`Failed to load document (Status: ${res.status}). ${errorText}`);
        }
      } catch (err) {
        setLoadError("An unexpected error occurred while loading the document.");
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
          toast.success("AI Processing Complete!");
        } else if (data.processing_status === "failed") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = null;
          setDoc(data);
          toast.error(data.processing_error || "Text extraction failed");
        }
      } catch {
        // Network error — keep polling
      }
    }, 3000);
  }, [id]);

  useEffect(() => {
    if (doc && (doc.processing_status === "processing" || doc.processing_status === "pending")) {
      startPolling();
    }
  }, [doc?.processing_status, startPolling]);

  useEffect(() => {
    let interval: { id: NodeJS.Timeout | null } = { id: null };
    const isExtracting = doc?.processing_status === "processing";

    if (isExtracting) {
      interval.id = setInterval(async () => {
        try {
          const res = await fetch(`/api/documents/${id}/status`);
          if (res.ok) {
            const data = await res.json();
            setOcrProgress(data.progress || 0);
            setOcrEta(data.eta ?? null);
          }
        } catch { }
      }, 1000);
    } else {
      setOcrProgress(0);
      setOcrEta(null);
    }
    return () => { if (interval.id) clearInterval(interval.id); };
  }, [doc?.processing_status, id]);

  // Sync questions state when document data updates
  useEffect(() => {
    if (doc?.questions && Array.isArray(doc.questions) && questions.length === 0) {
      setQuestions(doc.questions as GeneratedQuestion[]);
    }
  }, [doc?.questions, questions.length]);

  // --- Handlers ---

  async function handleStartOCR() {
    setDoc((prev) =>
      prev ? { ...prev, processing_status: "processing" as DocumentProcessingStatus, processing_error: null } : prev
    );

    try {
      const res = await fetch(`/api/documents/${id}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engine_preference: modelPreference,
          question_count: quizCount,
          difficulty: quizDifficulty,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start processing");
      }
      toast.info(`Processing started using ${modelPreference} engine...`);
      startPolling();
    } catch (err: any) {
      setDoc((prev) =>
        prev ? { ...prev, processing_status: "failed" as DocumentProcessingStatus, processing_error: err.message } : prev
      );
      toast.error(err.message);
    }
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
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Summarization failed");
      }
      const data = await res.json();
      if (!isChapter) {
        setDoc((prev) => (prev ? { ...prev, ai_summary: data.summary } : prev));
        toast.success("Main summary updated!");
      } else {
        toast.info("Chapter summary generated, copied to clipboard!");
        navigator.clipboard.writeText(data.summary);
      }
    } catch (err: any) {
      toast.error(err.message);
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
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Quiz generation failed");
      }
      const data = await res.json();
      const newQuestions = data.questions || [];
      setQuestions(newQuestions);

      if (!isChapter) {
        setDoc((prev) => (prev ? { ...prev, questions: newQuestions } : prev));
      }
      toast.success("Quiz generated!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGeneratingQuiz(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  async function handleSave() {
    if (!editTitle.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setDoc((prev) => (prev ? { ...prev, ...updated } : prev));
        setEditing(false);
        toast.success("Document updated");
      } else {
        const data = await res.json();
        toast.error(data.error || "Update failed");
      }
    } catch {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Document deleted");
        router.push("/dashboard/documents");
      } else {
        const data = await res.json();
        toast.error(data.error || "Delete failed");
      }
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  }

  const isReady = doc?.processing_status === "completed";
  const hasChapters = doc?.chapters && Array.isArray(doc.chapters) && doc.chapters.length > 0;

  if (authLoading || loading) return <FullPageSpinner />;

  if (loadError || !doc) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Document Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md text-center">
          {loadError || "The document you are looking for does not exist or has been removed."}
        </p>
        <BackButton />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-[1200px] mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-6">
        <div className="flex items-start gap-4">
          <div className="mt-1"><BackButton /></div>
          <div>
            {editing ? (
              <div className="space-y-2 mb-2">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-2xl font-bold text-slate-900 dark:text-slate-50 border-b-2 border-t-0 border-x-0 border-indigo-500 rounded-none bg-transparent h-auto py-1 shadow-none focus-visible:ring-0"
                  autoFocus
                />
                <Input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Description (optional)"
                  className="text-sm text-slate-500 dark:text-slate-400 border-b border-t-0 border-x-0 border-slate-300 dark:border-slate-600 rounded-none bg-transparent h-auto py-1 shadow-none focus-visible:ring-0"
                />
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600" onClick={handleSave} disabled={saving}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400" onClick={() => { setEditing(false); setEditTitle(doc.title); setEditDescription(doc.description || ""); }} disabled={saving}>
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1
                  className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 cursor-pointer group flex items-center gap-2"
                  onClick={() => setEditing(true)}
                >
                  {doc.title}
                  <RefreshCw className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h1>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn("px-2 py-0.5 text-[10px] font-bold border shadow-none", statusColors[doc.processing_status])}>
                {statusLabels[doc.processing_status]}
              </Badge>
            </div>

            {!editing && doc.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed mt-2">{doc.description}</p>
            )}
          </div>
        </div>

        <div className="flex flex-shrink-0 gap-2 items-center">
          {doc.download_url && (
            <a href={doc.download_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="font-mono text-xs text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                <Download className="h-3.5 w-3.5 mr-2" /> Download PDF
              </Button>
            </a>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDelete(true)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
          </Button>
        </div>
      </div>

      {/* Processing Setup (when not ready) */}
      {!isReady ? (
        <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-10 text-center space-y-6 shadow-sm">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 mb-2">
            {doc.processing_status === "processing"
              ? <Loader2 className="h-8 w-8 animate-spin" />
              : doc.processing_status === "failed"
                ? <AlertCircle className="h-8 w-8" />
                : <Tags className="h-8 w-8" />}
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              {doc.processing_status === "failed" ? "Extraction Failed" : "AI Text Extraction"}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {doc.processing_status === "failed"
                ? (doc.processing_error || "An error occurred during text extraction.")
                : "Extract searchable text from the uploaded PDF. Choose your engine and we\u2019ll handle the rest."}
            </p>
          </div>

          {doc.processing_status === "processing" ? (
            <div className="max-w-xs mx-auto space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 dark:text-slate-500 px-1">
                <span>Progress</span>
                <span>{ocrProgress}%</span>
              </div>
              <Progress value={ocrProgress} className="h-2 rounded-full bg-slate-100 dark:bg-slate-800" />
              {ocrEta !== null && (
                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 flex items-center justify-center gap-2">
                  <Clock className="h-3 w-3" /> ~{Math.ceil(ocrEta)}s remaining
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-full max-w-sm">
                {(["groq", "local"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setModelPreference(mode)}
                    className={cn(
                      "flex-1 py-2.5 px-4 rounded-md text-xs font-semibold transition-all",
                      modelPreference === mode
                        ? "bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-400 shadow-sm"
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    )}
                  >
                    {mode === "groq" ? "Groq (Fast)" : "Local Engine"}
                  </button>
                ))}
              </div>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={handleStartOCR}
              >
                <Sparkles className="h-4 w-4 mr-2" /> Start AI Extraction
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Main Content Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column */}
          <div className="lg:col-span-4 space-y-6">
            {/* Document Profile */}
            <section className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" /> Document Profile
              </h3>

              <div className="space-y-3 font-mono text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700 pt-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 dark:text-slate-500">File</span>
                  <span className="truncate max-w-[150px] font-medium text-slate-600 dark:text-slate-300" title={doc.file_name}>{doc.file_name}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 dark:text-slate-500">Size</span>
                  <span className="font-medium text-slate-600 dark:text-slate-300">{formatFileSize(doc.file_size)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 dark:text-slate-500">Uploaded</span>
                  <span className="font-medium text-slate-600 dark:text-slate-300">{formatDate(doc.created_at)}</span>
                </div>
                {doc.processed_at && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 dark:text-slate-500">Processed</span>
                    <span className="font-medium text-slate-600 dark:text-slate-300">{formatDate(doc.processed_at)}</span>
                  </div>
                )}
              </div>
            </section>

            {/* Topic / Chapter Selection */}
            {hasChapters && (
              <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="p-5">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
                    <Tags className="h-3.5 w-3.5" /> Topic / Chapter
                  </h3>
                </div>
                <div className="px-5 pb-5 space-y-1.5">
                  <button
                    onClick={() => setSelectedChapterIndex(-1)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-all",
                      selectedChapterIndex === -1
                        ? "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800"
                        : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-7 h-7 rounded-md flex items-center justify-center shrink-0",
                        selectedChapterIndex === -1 ? "bg-indigo-500 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-400"
                      )}>
                        <FileText className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className={cn("text-xs font-semibold", selectedChapterIndex === -1 ? "text-indigo-900 dark:text-indigo-300" : "text-slate-600 dark:text-slate-400")}>
                          Full Document
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Use entire extraction</p>
                      </div>
                    </div>
                  </button>

                  {doc.chapters?.map((chapter: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedChapterIndex(idx)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border transition-all",
                        selectedChapterIndex === idx
                          ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                          : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-7 h-7 rounded-md flex items-center justify-center shrink-0",
                          selectedChapterIndex === idx ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-400"
                        )}>
                          <span className="text-[10px] font-bold">{idx + 1}</span>
                        </div>
                        <div className="min-w-0">
                          <p className={cn("text-xs font-semibold truncate", selectedChapterIndex === idx ? "text-emerald-900 dark:text-emerald-300" : "text-slate-600 dark:text-slate-400")}>
                            {chapter.title}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* AI Actions */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <button
                onClick={() => setShowAI(!showAI)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
                  <Brain className="h-3.5 w-3.5" /> AI Actions
                </h3>
                {showAI ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </button>

              {showAI && (
                <div className="px-5 pb-5 space-y-4">
                  {selectedChapterIndex !== -1 && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800 rounded-lg p-2.5">
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                        Targeting: <span className="font-bold">{doc.chapters?.[selectedChapterIndex]?.title}</span>
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {/* Engine */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Engine</label>
                      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        {(["groq", "local"] as const).map((mode) => (
                          <button
                            key={mode}
                            onClick={() => setModelPreference(mode)}
                            className={cn(
                              "flex-1 py-1.5 rounded-md text-[10px] font-semibold transition-all",
                              modelPreference === mode
                                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            )}
                          >
                            {mode === "groq" ? "Groq (Fast)" : "Local"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Difficulty */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Difficulty</label>
                      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        {(["easy", "medium", "hard"] as const).map((level) => (
                          <button
                            key={level}
                            onClick={() => setQuizDifficulty(level)}
                            className={cn(
                              "py-1.5 rounded-md text-[10px] font-semibold capitalize transition-all",
                              quizDifficulty === level
                                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            )}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Question Count */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Questions: <span className="text-indigo-600 dark:text-indigo-400">{quizCount}</span>
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={quizCount}
                        onChange={(e) => setQuizCount(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                      <div className="flex justify-between text-[9px] text-slate-300 dark:text-slate-600">
                        <span>1</span>
                        <span>20</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 text-xs font-semibold gap-1.5"
                        disabled={summarizing}
                        onClick={handleSummarize}
                      >
                        {summarizing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                        Summary
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 text-xs font-semibold gap-1.5"
                        disabled={generatingQuiz}
                        onClick={handleGenerateQuiz}
                      >
                        {generatingQuiz ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />}
                        Quiz
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <Tabs defaultValue="quiz" className="space-y-4">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="quiz">Play Quiz</TabsTrigger>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="raw">Raw Text</TabsTrigger>
                </TabsList>

                {selectedChapterIndex !== -1 && (
                  <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-[10px] font-medium">
                    Context: {doc.chapters?.[selectedChapterIndex]?.title}
                  </Badge>
                )}
              </div>

              <TabsContent value="quiz">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm min-h-[400px]">
                  {quizResults ? (
                    <div className="p-4">
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
                    <div className="p-4">
                      <QuizPlayer
                        questions={questions}
                        onSubmit={async (answers, timeSpent) => {
                          const correct = questions.reduce((acc, q) => acc + (answers[q.id] === q.correct_answer ? 1 : 0), 0);
                          setQuizResults({
                            score: correct,
                            total: questions.length,
                            timeSpent,
                            userAnswers: answers,
                          });
                          toast.success(`You scored ${correct} out of ${questions.length}!`);
                        }}
                        title="Document Quiz"
                        showStartScreen={true}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
                      <Brain className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                      <div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Quiz Generated Yet</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs">Generate a quiz using the AI Actions panel to test your knowledge.</p>
                      </div>
                      <Button
                        onClick={handleGenerateQuiz}
                        disabled={generatingQuiz}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        {generatingQuiz ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Brain className="h-4 w-4 mr-2" />}
                        Generate Quiz
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="summary">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 sm:p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" /> AI Executive Summary
                    </h3>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => doc.ai_summary && copyToClipboard(doc.ai_summary)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={handleSummarize} disabled={summarizing}>
                        <RefreshCw className={cn("h-4 w-4", summarizing && "animate-spin")} />
                      </Button>
                    </div>
                  </div>

                  {doc.ai_summary ? (
                    <div className="prose prose-slate dark:prose-invert prose-sm max-w-none text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                      {doc.ai_summary}
                    </div>
                  ) : (
                    <div className="text-center py-12 space-y-4">
                      <Sparkles className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto" />
                      <p className="text-sm font-medium text-slate-400 dark:text-slate-500">No summary generated yet.</p>
                      <Button onClick={handleSummarize} disabled={summarizing} variant="outline" size="sm">
                        {summarizing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : null}
                        Generate Summary
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="raw">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 sm:p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Extracted Text</h3>
                    <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-500 dark:text-slate-400" onClick={() => doc.extracted_text && copyToClipboard(doc.extracted_text!)}>
                      Copy All
                    </Button>
                  </div>
                  <div className="h-[500px] overflow-y-auto pr-4" style={{ scrollbarWidth: "thin" }}>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-mono whitespace-pre-wrap">
                      {doc.extracted_text}
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is permanent. All data associated with &quot;{doc.title}&quot; will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
