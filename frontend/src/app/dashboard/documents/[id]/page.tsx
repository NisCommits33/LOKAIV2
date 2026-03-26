/**
 * dashboard/documents/[id]/page.tsx — Document Detail
 *
 * Shows full document metadata, download link, processing status,
 * extracted text preview, and on-demand AI actions (Summarize / Generate Quiz).
 *
 * Flow:
 * - Upload auto-triggers OCR text extraction
 * - Once text is extracted, user can Summarize or Generate Quiz independently
 *
 * @module app/dashboard/documents/[id]
 */

"use client";

import { useState, useEffect, useRef, use, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuizPlayer, QuizPlayerQuestion } from "@/components/quiz/QuizPlayer";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FullPageSpinner } from "@/components/loading";
import { BackButton } from "@/components/ui/back-button";
// Utility: format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Utility: format date
function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
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
  Save,
  Layout,
  Clock,
  Upload,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Loader2,
  BookOpen,
  Copy,
  RefreshCw,
  Brain,
  HelpCircle,
  FileText,
  Download,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { PersonalDocument, DocumentProcessingStatus } from "@/types/database";

const statusColors: Record<DocumentProcessingStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-100",
  processing: "bg-blue-50 text-blue-700 border-blue-100",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
  failed: "bg-red-50 text-red-700 border-red-100",
};

const statusLabels: Record<DocumentProcessingStatus, string> = {
  pending: "Extracting text...",
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

export default function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();

  // --- States ---
  const [doc, setDoc] = useState<DocumentDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete state
  const [showDelete, setShowDelete] = useState(false);
  const [showSummary, setShowSummary] = useState(true);
  const [showExtractedText, setShowExtractedText] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // On-demand AI states
  const [summarizing, setSummarizing] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);

  // Quiz controls
  const [quizCount, setQuizCount] = useState(5);
  const [quizDifficulty, setQuizDifficulty] = useState("medium");

  // OCR progress state
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrEta, setOcrEta] = useState<number | null>(null);
  const [modelPreference, setModelPreference] = useState<"local" | "groq">("groq");
  const [selectedChapterIndex, setSelectedChapterIndex] = useState<number>(-1); // -1 for Full Document

  // --- Refs ---
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Effects ---

  // Initial data fetch
  useEffect(() => {
    console.log("[DocumentDetailPage] useEffect triggered, id:", id);
    setLoading(true);
    (async () => {
      try {
        console.log("[DocumentDetailPage] Fetching /api/documents/" + id);
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
        console.error("[DocumentDetailPage] Fetch error:", err);
        setLoadError("An unexpected error occurred while loading the document.");
      }
      setLoading(false);
    })();
  }, [id]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Poll for OCR text extraction completion
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
          toast.success("Text extracted successfully!");
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

  // Trigger polling if document is already processing on mount or after fetch
  useEffect(() => {
    if (doc && (doc.processing_status === "processing" || doc.processing_status === "pending")) {
      startPolling();
    }
  }, [doc?.processing_status, startPolling]);

  // OCR progress status polling
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const isExtracting = doc?.processing_status === "processing";

    if (isExtracting) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/ai/status/${id}`);
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
    return () => { if (interval) clearInterval(interval); };
  }, [doc?.processing_status, id]);

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
    } catch (err) {
      const message = err instanceof Error ? err.message : "Extraction failed";
      setDoc((prev) =>
        prev ? { ...prev, processing_status: "failed" as DocumentProcessingStatus, processing_error: message } : prev
      );
      toast.error(message);
    }
  }

  async function handleSummarize() {
    setSummarizing(true);
    try {
      const isChapter = selectedChapterIndex !== -1;
      const textToSummarize = isChapter
        ? doc.chapters?.[selectedChapterIndex]?.content
        : doc.extracted_text;

      const res = await fetch(`/api/documents/${id}/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engine: modelPreference,
          text: isChapter ? textToSummarize : undefined
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Summarization failed");
      }
      const data = await res.json();
      setDoc((prev) => (prev ? { ...prev, ai_summary: data.summary } : prev));
      toast.success("Summary generated!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Summarization failed";
      toast.error(message);
    } finally {
      setSummarizing(false);
    }
  }

  async function handleGenerateQuiz() {
    setGeneratingQuiz(true);
    try {
      const isChapter = selectedChapterIndex !== -1;
      const textToProcess = isChapter
        ? doc.chapters?.[selectedChapterIndex]?.content
        : doc.extracted_text;

      const res = await fetch(`/api/documents/${id}/generate-questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: quizCount,
          difficulty: quizDifficulty,
          engine: modelPreference,
          text: isChapter ? textToProcess : undefined
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Quiz generation failed");
      }
      const data = await res.json();
      setQuestions(data.questions || []);
      toast.success("Quiz generated!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Quiz generation failed";
      toast.error(message);
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

  // --- Derived states for UI ---
  const isProcessing = doc?.processing_status === "processing";
  const isPending = doc?.processing_status === "pending";
  const isReady = doc?.processing_status === "completed";
  const isFailed = doc?.processing_status === "failed";

  // --- Conditional Returns ---
  if (authLoading || (loading && !doc)) {
    if (loadError) {
      return (
        <div className="p-6 sm:p-8 text-center py-20">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <p className="font-medium text-red-500">{loadError}</p>
          <div className="mt-6">
            <BackButton />
          </div>
        </div>
      );
    }
    return <FullPageSpinner />;
  }

  if (!doc) {
    return (
      <div className="p-6 sm:p-8 text-center py-20">
        <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">Document not found</p>
        <div className="mt-6">
          <BackButton />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-[1400px] mx-auto space-y-8 pb-12">
      {/* --- GLOBAL HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-start gap-4">
          <div className="mt-1"><BackButton /></div>
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              {editing ? (
                <div className="flex flex-col gap-2 w-full max-w-md">
                  <Input id="title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="font-bold text-lg h-10 border-slate-300" />
                  <div className="flex gap-2 mt-1">
                    <Button size="sm" onClick={handleSave} disabled={saving} className="bg-slate-900 text-white hover:bg-slate-800">
                      {saving ? "Saving..." : "Save"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setEditTitle(doc.title); setEditDescription(doc.description || ""); }}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">{doc.title}</h1>
                  <Badge variant="outline" className={`font-mono uppercase text-[10px] tracking-wider px-2 py-0.5 ${statusColors[doc.processing_status]}`}>
                    {isProcessing && <Loader2 className="h-3 w-3 mr-1.5 animate-spin inline-block" />}
                    {isReady && <CheckCircle2 className="h-3 w-3 mr-1.5 inline-block" />}
                    {isFailed && <AlertCircle className="h-3 w-3 mr-1.5 inline-block" />}
                    {statusLabels[doc.processing_status]}
                  </Badge>
                </>
              )}
            </div>
            {!editing && doc.description && <p className="text-sm text-slate-500 max-w-3xl leading-relaxed">{doc.description}</p>}
            {!editing && (
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="text-[11px] uppercase tracking-widest font-bold text-indigo-500 hover:text-indigo-700 h-6 px-0 mt-2 bg-transparent shadow-none hover:bg-transparent">
                Edit Details
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-shrink-0 gap-2 items-center">
          {doc.download_url && (
            <a href={doc.download_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="font-mono text-xs text-slate-600 border-slate-200 hover:bg-slate-50">
                <Download className="h-3.5 w-3.5 mr-2" /> Download
              </Button>
            </a>
          )}
          <Button
            variant="outline"
            size="sm"
            className="font-mono text-xs text-red-500 border-red-100 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
            onClick={() => setShowDelete(true)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
          </Button>
        </div>
      </div>

      {/* --- TWO COLUMN LAYOUT --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* === LEFT COLUMN: Controls & Context (4 cols) === */}
        <div className="lg:col-span-4 space-y-6">

          {/* Metadata section */}
          <section className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <FileText className="h-3.5 w-3.5" /> File Metadata
            </h3>
            <div className="space-y-3 font-mono text-[11px] text-slate-600">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-slate-400">Name</span>
                <span className="truncate max-w-[150px] font-medium text-slate-700" title={doc.file_name}>{doc.file_name}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-slate-400">Size</span>
                <span className="font-medium text-slate-700">{formatFileSize(doc.file_size)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-slate-400">Uploaded</span>
                <span className="font-medium text-slate-700">{formatDate(doc.created_at)}</span>
              </div>
              {doc.processed_at && (
                <div className="flex justify-between items-center pt-0">
                  <span className="text-slate-400">Processed</span>
                  <span className="font-medium text-slate-700">{formatDate(doc.processed_at)}</span>
                </div>
              )}
            </div>
          </section>

          {/* Engine Setup */}
          <section className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-indigo-100 to-white rounded-bl-full opacity-50 z-0" />
            <div className="relative z-10">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                <Brain className="h-3.5 w-3.5" /> AI Model
              </h3>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">Select the backend model for processing this document. Cloud is faster, Local is private.</p>
              <Select value={modelPreference} onValueChange={(val: any) => setModelPreference(val)} disabled={isProcessing}>
                <SelectTrigger className="w-full bg-slate-50 border-slate-200 text-sm font-medium h-10">
                  <SelectValue placeholder="Select Engine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="groq" className="font-semibold text-indigo-700">Cloud (Groq - Instant)</SelectItem>
                  <SelectItem value="local" className="font-semibold text-slate-700">Local (BART/T5 - Private)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>

          {/* Document Scope / Chapters */}
          {isReady && doc.chapters && doc.chapters.length > 0 && (
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[500px]">
              <div className="bg-slate-50 p-4 border-b border-slate-200 shrink-0">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Layout className="h-3.5 w-3.5" /> Chapters
                </h3>
                <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Select a segment to target AI actions.</p>
              </div>
              <div className="overflow-y-auto w-full custom-scrollbar">
                <button
                  onClick={() => setSelectedChapterIndex(-1)}
                  className={`w-full flex items-center gap-3 text-left px-4 py-3 text-sm transition-all border-b border-slate-100 last:border-0 ${selectedChapterIndex === -1
                      ? "bg-indigo-50/50 text-indigo-700 font-semibold border-l-4 border-l-indigo-500"
                      : "bg-white text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent"
                    }`}
                >
                  <FileText className={`h-4 w-4 shrink-0 ${selectedChapterIndex === -1 ? 'text-indigo-500' : 'text-slate-400'}`} />
                  <span className="truncate">Entire Document</span>
                </button>
                {doc.chapters.map((ch, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedChapterIndex(idx)}
                    className={`w-full flex items-center gap-3 text-left px-4 py-3 text-sm transition-all border-b border-slate-100 last:border-0 group ${selectedChapterIndex === idx
                        ? "bg-indigo-50/50 text-indigo-700 font-semibold border-l-4 border-l-indigo-500"
                        : "bg-white text-slate-500 hover:bg-slate-50 border-l-4 border-l-transparent"
                      }`}
                  >
                    <span className={`text-[10px] font-mono shrink-0 ${selectedChapterIndex === idx ? 'text-indigo-400' : 'text-slate-300'}`}>
                      {(idx + 1).toString().padStart(2, '0')}
                    </span>
                    <span className="line-clamp-2 leading-snug">{ch.title}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Extraction Progress Box */}
          {isProcessing && (
            <section className="bg-blue-50/50 rounded-xl p-5 border border-blue-100 shadow-sm">
              <div className="flex items-start gap-4">
                <Loader2 className="h-5 w-5 text-blue-500 animate-spin shrink-0 mt-0.5" />
                <div className="w-full">
                  <p className="text-sm font-bold text-blue-800 tracking-tight">Extracting Text</p>
                  <p className="text-xs text-blue-600/80 mt-1 font-medium leading-relaxed">
                    Executing background OCR. AI functions will unlock once finished.
                  </p>
                  <Progress value={Math.round(ocrProgress * 100)} className="h-2mt-3 bg-blue-100/50" />
                  <div className="flex justify-between items-center text-[10px] font-mono font-bold text-blue-500 uppercase mt-2">
                    <span>{Math.round(ocrProgress * 100)}%</span>
                    {ocrEta !== null && ocrEta >= 0 ? <span>{Math.floor(ocrEta / 60)}m {ocrEta % 60}s</span> : <span>Calculating...</span>}
                  </div>
                </div>
              </div>
            </section>
          )}

          {isFailed && (
            <section className="bg-red-50/50 rounded-xl p-5 border border-red-100 shadow-sm text-center">
              <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
              <p className="text-sm font-bold text-red-800 mb-1">Extraction Failed</p>
              <p className="text-xs text-red-600 mb-4">{doc.processing_error || "Unknown error occurred"}</p>
              <Button variant="outline" size="sm" onClick={handleStartOCR} className="bg-white border-red-200 text-red-700 hover:bg-red-50">
                <RefreshCw className="h-3.5 w-3.5 mr-2" /> Retry Extraction
              </Button>
            </section>
          )}

          {isPending && (
            <section className="bg-amber-50/50 rounded-xl p-5 border border-amber-100 shadow-sm">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-800">Ready for Extraction</p>
                  <p className="text-xs text-amber-600 mt-1 font-medium leading-relaxed mb-3">
                    File is ready. Run extraction to enable the Smart Summary and Quiz features.
                  </p>
                  <Button size="sm" onClick={handleStartOCR} className="bg-amber-500 hover:bg-amber-600 text-white w-full">
                    <Upload className="h-3.5 w-3.5 mr-2" /> Start Extraction
                  </Button>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* === RIGHT COLUMN: Intelligence Workspace (8 cols) === */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {isReady && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">

              {/* Toolbar Section */}
              <div className="bg-slate-50 border-b border-slate-200 p-4 sm:px-6 flex flex-wrap gap-4 items-center justify-between">

                {/* Summarize Action */}
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleSummarize}
                    disabled={summarizing}
                    className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm h-10 px-5 rounded-lg transition-all"
                  >
                    {summarizing ? <Loader2 className="h-4 w-4 mr-2 animate-spin text-slate-300" /> : <Sparkles className="h-4 w-4 mr-2 text-indigo-300" />}
                    <span className="font-semibold tracking-wide text-sm">{doc.ai_summary ? "Regenerate Summary" : "Generate Summary"}</span>
                  </Button>
                </div>

                {/* Vertical Divider */}
                <div className="hidden sm:block w-px h-8 bg-slate-200"></div>

                {/* Quiz Generation Actions */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm h-10">
                    <div className="px-3 bg-slate-50 border-r border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center h-full">
                      Quiz
                    </div>
                    <Select value={quizDifficulty} onValueChange={setQuizDifficulty} disabled={generatingQuiz}>
                      <SelectTrigger className="w-[100px] h-full border-0 rounded-none shadow-none text-xs font-semibold text-slate-700 bg-transparent focus:ring-0 px-3">
                        <SelectValue placeholder="Diff" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy" className="text-xs font-bold text-emerald-600">Easy</SelectItem>
                        <SelectItem value="medium" className="text-xs font-bold text-amber-600">Medium</SelectItem>
                        <SelectItem value="hard" className="text-xs font-bold text-red-600">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="w-px h-full bg-slate-200"></div>
                    <Input
                      type="number"
                      min={1} max={20}
                      value={quizCount}
                      onChange={e => setQuizCount(Math.max(1, Math.min(20, Number(e.target.value))))}
                      className="w-[60px] h-full border-0 rounded-none shadow-none text-xs font-mono font-bold text-center bg-transparent focus-visible:ring-0 px-2"
                      disabled={generatingQuiz}
                    />
                  </div>

                  <Button
                    onClick={handleGenerateQuiz}
                    disabled={generatingQuiz}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-10 px-5 rounded-lg transition-all"
                  >
                    {generatingQuiz ? <Loader2 className="h-4 w-4 mr-2 animate-spin text-indigo-200" /> : <Brain className="h-4 w-4 mr-2 text-indigo-200" />}
                    <span className="font-semibold tracking-wide text-sm">{questions.length > 0 ? "Regenerate Quiz" : "Generate Quiz"}</span>
                  </Button>
                </div>
              </div>

              {/* Workspace Content Canvas */}
              <div className="p-6 sm:p-8 bg-white min-h-[500px] flex flex-col gap-10">

                {/* Placeholder if nothing generated */}
                {!doc.ai_summary && questions.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-40">
                    <Brain className="h-16 w-16 text-slate-300 mb-4" />
                    <p className="text-slate-500 font-medium tracking-wide">Workspace Empty</p>
                    <p className="text-xs text-slate-400 mt-2 max-w-xs text-center">Use the toolbar above to generate summaries or quizzes based on the selected scope.</p>
                  </div>
                )}

                {/* AI Summary Block */}
                {doc.ai_summary && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setShowSummary(!showSummary)}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-500" /> Summary
                      </h3>
                      {showSummary ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </button>
                    <AnimatePresence>
                      {showSummary && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="overflow-hidden bg-white border-t border-slate-200"
                        >
                          <div className="p-4 flex justify-end bg-slate-50/50 border-b border-slate-100">
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => copyToClipboard(doc.ai_summary!)}
                              className="h-7 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            >
                              <Copy className="h-3 w-3 mr-1.5" /> Copy
                            </Button>
                          </div>
                          <div className="prose prose-slate prose-sm max-w-none text-slate-700 leading-relaxed bg-slate-50/50 p-6 whitespace-pre-wrap">
                            {doc.ai_summary}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* AI Quiz Block */}
                {questions.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-slate-100 pb-3">
                      <div className="space-y-1">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                          <HelpCircle className="h-3.5 w-3.5 text-purple-500" /> Quiz
                        </h3>
                      </div>
                    </div>
                    <div className="bg-slate-50/30 p-2 rounded-xl border border-slate-100">
                      <QuizPlayer
                        questions={questions}
                        onSubmit={async (answers, timeSpent) => {
                          const correct = questions.reduce((acc, q) => acc + (answers[q.id] === q.correct_answer ? 1 : 0), 0);
                          toast.success(`You scored ${correct} out of ${questions.length}!`);
                        }}
                        title="Quiz"
                        showStartScreen={true}
                      />
                    </div>
                  </div>
                )}

                {/* Raw Extracted Text Block (Collapsible) */}
                {doc.extracted_text && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden mt-8">
                    <button
                      onClick={() => setShowExtractedText(!showExtractedText)}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5" /> Extracted Text
                      </h3>
                      {showExtractedText ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </button>
                    <AnimatePresence>
                      {showExtractedText && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="overflow-hidden bg-white border-t border-slate-200"
                        >
                          <div className="p-4 flex justify-end bg-slate-50/50 border-b border-slate-100">
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => copyToClipboard(doc.extracted_text!)}
                              className="h-7 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700"
                            >
                              <Copy className="h-3 w-3 mr-1.5" /> Copy Text
                            </Button>
                          </div>
                          <div className="p-6 max-h-[500px] overflow-y-auto bg-slate-900 custom-scrollbar">
                            <p className="text-[11px] font-mono text-slate-300 leading-relaxed whitespace-pre-wrap selection:bg-indigo-500/30">
                              {doc.extracted_text}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

              </div>
            </div>
          )}

        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent className="border-red-100 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" /> Delete Document
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              This will permanently delete <span className="font-semibold text-slate-900">&quot;{doc.title}&quot;</span> and its
              associated files. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="border-slate-200 text-slate-600 font-semibold">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white font-bold tracking-wide shadow-sm"
            >
              {deleting ? "Deleting..." : "Permanently Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

