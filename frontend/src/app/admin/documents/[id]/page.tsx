"use client";

import { useState, useEffect, useRef, use, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ShieldCheck,
  Check,
  XIcon,
  HelpCircle,
  FileText,
  Download,
  Trash2,
  Tags,
  Building2,
  Brain,
  Sparkles,
  Layout,
  Clock,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Copy,
  Plus,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
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
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { PersonalDocument, DocumentProcessingStatus } from "@/types/database";

// --- HELPERS ---

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${((bytes / 1024)).toFixed(1)} KB`;
  return `${((bytes / (1024 * 1024))).toFixed(1)} MB`;
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

function CheckItem({ label, checked, subtext }: { label: string; checked: boolean; subtext?: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className={cn(
        "mt-0.5 h-4 w-4 rounded-full flex items-center justify-center shrink-0 border",
        checked ? "bg-emerald-500 border-emerald-500" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600"
      )}>
        {checked ? <Check className="h-2.5 w-2.5 text-white" /> : null}
      </div>
      <div>
        <p className={cn("text-xs font-medium", checked ? "text-slate-700 dark:text-slate-300" : "text-slate-400 dark:text-slate-500")}>
          {label}
        </p>
        {subtext && (
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{subtext}</p>
        )}
      </div>
    </div>
  );
}

const statusColors: Record<DocumentProcessingStatus, string> = {
  pending: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800",
  processing: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-800",
  completed: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800",
  failed: "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800",
};

const statusLabels: Record<DocumentProcessingStatus, string> = {
  pending: "Extracting text...",
  processing: "Extracting text...",
  completed: "Ready",
  failed: "Extraction Failed",
};

interface OrgDocumentDetailData extends PersonalDocument {
  download_url: string | null;
  department_id?: { name: string } | string | null;
  policy_tag?: string | null;
  chapter_tag?: string | null;
  section_tag?: string | null;
  is_published: boolean;
  published_at: string | null;
  target_department_id: string | null;
  target_job_level_id: string | null;
  ai_summary: string | null;
  chapters: Array<{ title: string, content: string }> | null;
  questions: GeneratedQuestion[];
}

interface GeneratedQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}

function QuizReviewList({ questions }: { questions: GeneratedQuestion[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-slate-700 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-500" /> Admin Review Mode
        </h4>
        <Badge variant="outline" className="text-[10px] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700">
          {questions.length} Questions
        </Badge>
      </div>

      {questions.map((q, qIdx) => (
        <div key={q.id || qIdx} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[11px] font-bold">
              {qIdx + 1}
            </span>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed pt-0.5">{q.question}</p>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            {q.options.map((option, oIdx) => (
              <div
                key={oIdx}
                className={cn(
                  "p-3 rounded-lg border text-xs font-medium flex items-center justify-between",
                  oIdx === q.correct_answer
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                    : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                )}
              >
                <span className="flex-1 pr-2">{option}</span>
                {oIdx === q.correct_answer && <Check className="h-3.5 w-3.5 shrink-0" />}
              </div>
            ))}
          </div>
          {q.explanation && (
            <div className="px-4 pb-4">
              <div className="bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800">
                <p className="text-[10px] uppercase font-semibold tracking-wider text-indigo-400 dark:text-indigo-500 mb-1 flex items-center gap-1.5">
                  <HelpCircle className="h-3 w-3" /> Explanation
                </p>
                <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">{q.explanation}</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// --- MAIN COMPONENT ---

export default function OrgDocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { dbUser, isLoading: authLoading } = useAuth();

  const [doc, setDoc] = useState<OrgDocumentDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [summarizing, setSummarizing] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);

  const [quizCount, setQuizCount] = useState(5);
  const [quizDifficulty, setQuizDifficulty] = useState("medium");
  const [distTopic, setDistTopic] = useState("");

  // Collapsible section states
  const [showTopics, setShowTopics] = useState(true);
  const [showAI, setShowAI] = useState(true);
  const [showDist, setShowDist] = useState(true);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showQuizReview, setShowQuizReview] = useState(true);

  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrEta, setOcrEta] = useState<number | null>(null);
  const [modelPreference, setModelPreference] = useState<"local" | "groq">("groq");
  const [selectedChapterIndex, setSelectedChapterIndex] = useState<number>(-1);

  // Distribution & Publishing States
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [jobLevels, setJobLevels] = useState<{ id: string; name: string }[]>([]);
  const [targetDept, setTargetDept] = useState<string>("all");
  const [targetLevel, setTargetLevel] = useState<string>("all");
  const [isPublishing, setIsPublishing] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/org/documents/${id}`);
        if (res.ok) {
          const data = await res.json();
          setDoc(data);
          setEditTitle(data.title);

          if (data.questions && Array.isArray(data.questions)) {
            setQuestions(data.questions);
          }

          // Set initial publishing targets if they exist
          if (data.target_department_id) setTargetDept(data.target_department_id);
          if (data.target_job_level_id) setTargetLevel(data.target_job_level_id);

        } else {
          setLoadError("Failed to load organization document");
        }
      } catch (err) {
        setLoadError("An unexpected error occurred.");
      }
      setLoading(false);
    })();
  }, [id]);

  // Fetch metadata for distribution
  useEffect(() => {
    if (!dbUser?.organization_id) return;

    const fetchMetadata = async () => {
      try {
        const [deptsRes, levelsRes] = await Promise.all([
          fetch(`/api/departments?organization_id=${dbUser.organization_id}`),
          fetch(`/api/job-levels?organization_id=${dbUser.organization_id}`),
        ]);

        if (deptsRes.ok) {
          const depts = await deptsRes.json();
          setDepartments(depts);
        }
        if (levelsRes.ok) {
          const levels = await levelsRes.json();
          setJobLevels(levels);
        }
      } catch (err) {
        console.error("Failed to fetch metadata", err);
      }
    };

    fetchMetadata();
  }, [dbUser?.organization_id]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const startPolling = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/org/documents/${id}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.processing_status === "completed") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = null;

          // CRITICAL: Update both doc AND questions/summary states
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
      } catch (err) {
        console.error("Polling error:", err);
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
          const res = await fetch(`/api/org/documents/${id}/status`);
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

  // Sync questions state when document data updates (e.g. from polling or initial load)
  useEffect(() => {
    if (doc?.questions && Array.isArray(doc.questions) && questions.length === 0) {
      setQuestions(doc.questions);
    }
  }, [doc?.questions, questions.length]);

  async function handleStartOCR() {
    setDoc((prev) =>
      prev ? { ...prev, processing_status: "processing" as DocumentProcessingStatus, processing_error: null } : prev
    );

    try {
      const res = await fetch(`/api/org/documents/${id}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engine_preference: modelPreference,
          question_count: quizCount,
          difficulty: quizDifficulty,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to start processing");
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

      const res = await fetch(`/api/org/documents/${id}/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engine: modelPreference,
          text: isChapter ? textToSummarize : undefined
        }),
      });
      if (!res.ok) {
        throw new Error("Summarization failed");
      }
      const data = await res.json();
      if (!isChapter) {
        setDoc((prev) => (prev ? { ...prev, ai_summary: data.summary } : prev));
        toast.success("Main summary updated!");
      } else {
        // Just show toast for chapter since we don't save it to master record
        toast.info("Chapter summary generated, copy it from the clipboard!");
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

      const res = await fetch(`/api/org/documents/${id}/generate-questions`, {
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
        throw new Error("Quiz generation failed");
      }
      const data = await res.json();
      const newQuestions = data.questions || [];
      setQuestions(newQuestions);

      // Also update the doc object to keep it consistent
      if (!isChapter) {
        setDoc(prev => prev ? { ...prev, questions: newQuestions } : prev);
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

  async function handlePublish() {
    if (!isReady) {
      toast.error("Document text must be extracted first");
      return;
    }

    if (!doc?.is_published && (!doc?.questions || doc.questions.length === 0)) {
      toast.error("Please generate and review a practice quiz before publishing.");
      return;
    }

    setIsPublishing(true);
    try {
      const res = await fetch(`/api/org/documents/${id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_published: !doc?.is_published,
          target_department_id: targetDept === "all" ? null : targetDept,
          target_job_level_id: targetLevel === "all" ? null : targetLevel,
          difficulty_level: quizDifficulty,
          num_questions: quizCount,
          topic: distTopic.trim() || null,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setDoc((prev) => (prev ? { ...prev, ...updated } : prev));
        toast.success(updated.is_published ? "Published to Employees" : "Moved to Drafts");
      } else {
        const errText = await res.text();
        try {
          const err = JSON.parse(errText);
          toast.error(err.error || "Publish failed");
        } catch {
          console.error("Publish failed with HTML:", errText);
          toast.error("Publish failed: Server returned an unexpected error.");
        }
      }
    } catch {
      toast.error("An error occurred while publishing");
    } finally {
      setIsPublishing(false);
    }
  }

  async function handlePushNewVersion() {
    if (!isReady) {
      toast.error("Document text must be extracted first");
      return;
    }

    if (!doc?.questions || doc.questions.length === 0) {
      toast.error("Please generate and review a practice quiz before pushing.");
      return;
    }

    setIsPublishing(true);
    try {
      const res = await fetch(`/api/org/documents/${id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_published: true,
          create_new_version: true,
          target_department_id: targetDept === "all" ? null : targetDept,
          difficulty_level: quizDifficulty,
          num_questions: quizCount,
          topic: distTopic.trim() || null,
        }),
      });

      if (res.ok) {
        const duplicated = await res.json();
        toast.success("Successfully pushed as new library card!");
        router.push(`/admin/documents/${duplicated.id}`);
      } else {
        toast.error("Failed to push new version");
      }
    } catch {
      toast.error("An error occurred while pushing new version");
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleSave() {
    if (!editTitle.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/org/documents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setDoc((prev) => (prev ? { ...prev, ...updated } : prev));
        setEditing(false);
        toast.success("Document metadata updated");
      } else {
        toast.error("Update failed");
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
      const res = await fetch(`/api/org/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Organization Document deleted");
        router.push("/admin/documents");
      } else {
        toast.error("Delete failed");
      }
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  }

  const isReady = doc?.processing_status === "completed";
  const hasChapters = doc?.chapters && Array.isArray(doc.chapters) && (doc.chapters.length > 0);

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

  if (dbUser?.role !== "org_admin" && dbUser?.role !== "super_admin") {
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        Access Denied
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
              <div className="flex items-center gap-2 mb-2">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-2xl font-bold text-slate-900 border-b-2 border-t-0 border-x-0 border-indigo-500 rounded-none bg-transparent h-auto py-1 shadow-none focus-visible:ring-0"
                  autoFocus
                />
                <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600" onClick={handleSave} disabled={saving}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400" onClick={() => { setEditing(false); setEditTitle(doc.title); }} disabled={saving}>
                  <XIcon className="h-4 w-4" />
                </Button>
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
              {doc.is_published && (
                <Badge className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                  Published
                </Badge>
              )}
            </div>

            {doc.description && (
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
            {doc.processing_status === "processing" ? <Loader2 className="h-8 w-8 animate-spin" /> : <Tags className="h-8 w-8" />}
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">AI Text Extraction</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Extract searchable text from the uploaded PDF. Choose your engine and we&apos;ll handle the rest.
            </p>
          </div>

          {doc.processing_status === "processing" ? (
            <div className="max-w-xs mx-auto space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
                <span>Progress</span>
                <span>{ocrProgress}%</span>
              </div>
              <Progress value={ocrProgress} className="h-2 rounded-full bg-slate-100" />
              {ocrEta && (
                <p className="text-[10px] font-medium text-slate-400 flex items-center justify-center gap-2">
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

              <div className="flex flex-wrap gap-2 mb-4">
                {doc.department_id ? (
                  <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] border-transparent font-medium">
                    <Building2 className="w-3 h-3 mr-1" />
                    {typeof doc.department_id === "object" ? (doc.department_id as any).name : `Dept`}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800 text-[11px] font-medium">
                    <Building2 className="w-3 h-3 mr-1" /> Org-Wide
                  </Badge>
                )}
                {doc.policy_tag && (
                  <Badge variant="outline" className="text-slate-500 dark:text-slate-400 font-mono text-[10px]">
                    # {doc.policy_tag}
                  </Badge>
                )}
              </div>

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
                  <span className="text-slate-400 dark:text-slate-500">Added</span>
                  <span className="font-medium text-slate-600 dark:text-slate-300">{formatDate(doc.created_at)}</span>
                </div>
              </div>
            </section>

            {/* Topic Selection */}
            {hasChapters && (
              <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <button
                  onClick={() => setShowTopics(!showTopics)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
                    <Tags className="h-3.5 w-3.5" /> Topic / Chapter
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {(doc.chapters?.length || 0) + 1} options
                    </Badge>
                    {showTopics ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </div>
                </button>

                {showTopics && <div className="px-5 pb-5 space-y-1.5">
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
                </div>}
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

              {showAI && <div className="px-5 pb-5 space-y-4">

              {selectedChapterIndex !== -1 && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800 rounded-lg p-2.5">
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                    Targeting: <span className="font-bold">{doc.chapters?.[selectedChapterIndex]?.title}</span>
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Difficulty</label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    {(["easy", "medium", "hard"] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setQuizDifficulty(level)}
                        className={cn(
                          "py-1.5 rounded-md text-[10px] font-semibold capitalize transition-all",
                          quizDifficulty === level ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        )}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Questions: <span className="text-indigo-600 dark:text-indigo-400">{quizCount}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={quizCount}
                    onChange={(e) => setQuizCount(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-300">
                    <span>1</span>
                    <span>50</span>
                  </div>
                </div>

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
              </div>}
            </section>

            {/* Distribution Setup */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <button
                onClick={() => setShowDist(!showDist)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
                  <Layout className="h-3.5 w-3.5" /> Distribution
                </h3>
                {showDist ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </button>

              {showDist && <div className="px-5 pb-5 space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed italic">
                    Publishing shares the <strong>Full Intelligence Workspace</strong> (Extracted Text, Chapters, and Summary) along with the practice quiz.
                  </p>
                </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Library Label (Topic)</label>
                  <Input
                    value={distTopic}
                    onChange={(e) => setDistTopic(e.target.value)}
                    placeholder="e.g. Fire Safety Policy, Chapter 1 Overview..."
                    className="h-9 text-xs"
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">This will be the main title seen by employees.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Target Department</label>
                  <Select value={targetDept} onValueChange={setTargetDept}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">All Departments</SelectItem>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id} className="text-xs">{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Job Level</label>
                  <Select value={targetLevel} onValueChange={setTargetLevel}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="All Levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">All Levels</SelectItem>
                      {jobLevels.map((l) => (
                        <SelectItem key={l.id} value={l.id} className="text-xs">{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Button
                  className={cn(
                    "w-full",
                    doc.is_published
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  )}
                  onClick={handlePublish}
                  disabled={isPublishing}
                >
                  {isPublishing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : doc.is_published ? (
                    <XIcon className="h-4 w-4 mr-2" />
                  ) : (
                    <ShieldCheck className="h-4 w-4 mr-2" />
                  )}
                  {doc.is_published ? "Unpublish" : "Publish to Library"}
                </Button>

                {doc.is_published && (
                  <Button
                    variant="outline"
                    className="w-full border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                    onClick={handlePushNewVersion}
                    disabled={isPublishing}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Push as New Card
                  </Button>
                )}
              </div>

              {doc.is_published && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800 rounded-lg p-3 mt-2">
                  <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3" /> Published &amp; visible to targeted employees
                  </p>
                </div>
              )}
              </div>}
            </section>

            {/* Admin Checklist */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <button
                onClick={() => setShowChecklist(!showChecklist)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Checklist
                </h3>
                {showChecklist ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </button>
              {showChecklist && <div className="px-5 pb-5 space-y-3">
              <CheckItem label="Text Extracted" checked={isReady} />
              <CheckItem label="Topic Selected" checked={selectedChapterIndex !== -1} subtext={selectedChapterIndex === -1 ? "Using full document" : `Chapter ${selectedChapterIndex + 1}`} />
              <CheckItem label="Quiz Generated" checked={questions.length > 0} />
              <CheckItem label="Summary Created" checked={!!doc.ai_summary} />
              <CheckItem label="Targeting Set" checked={targetDept !== "all" || targetLevel !== "all"} subtext={targetDept === "all" && targetLevel === "all" ? "All employees" : "Filtered"} />
              </div>}
            </section>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <Tabs defaultValue="quiz" className="space-y-4">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="quiz">Review Quiz</TabsTrigger>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="raw">Raw Text</TabsTrigger>
                </TabsList>

                {selectedChapterIndex !== -1 && (
                  <Badge variant="outline" className="bg-emerald-50 border-emerald-100 text-emerald-700 text-[10px] font-medium">
                    Context: {doc.chapters?.[selectedChapterIndex]?.title}
                  </Badge>
                )}
              </div>

              <TabsContent value="quiz">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm min-h-[400px]">
                  {questions.length > 0 ? (
                    <div>
                      <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50">Admin Review Mode</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Review the generated questions before publishing. Employees will receive these when you push this document.</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowQuizReview(!showQuizReview)}
                          className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-600 shrink-0"
                        >
                          {showQuizReview ? "Hide" : "Show"} Questions
                          {showQuizReview ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      {showQuizReview && (
                        <div className="p-6">
                          <QuizReviewList questions={questions} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
                      <Brain className="h-12 w-12 text-slate-300" />
                      <div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Quiz Generated Yet</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs">Generate a quiz using the AI Actions panel to review before publishing.</p>
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
                      <Sparkles className="h-12 w-12 text-slate-300 mx-auto" />
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
                    <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-500 dark:text-slate-400" onClick={() => doc.extracted_text && copyToClipboard(doc.extracted_text)}>
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
              This action is permanent. All employee progress, analytics, and library cards associated with this document will be removed.
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
