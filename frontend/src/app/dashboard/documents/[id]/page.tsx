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

import { useState, useEffect, useRef, use } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { BackButton } from "@/components/ui/back-button";
import {
  FileText,
  Download,
  Trash2,
  Save,
  Clock,
  Upload,
  AlertCircle,
  CheckCircle2,
  Loader2,
  BookOpen,
  Copy,
  RefreshCw,
  Brain,
  HelpCircle,
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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

  const [doc, setDoc] = useState<DocumentDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete state
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // OCR polling
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // On-demand AI states
  const [summarizing, setSummarizing] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);

  useEffect(() => {
    async function fetchDoc() {
      const res = await fetch(`/api/documents/${id}`);
      if (res.ok) {
        const data = await res.json();
        setDoc(data);
        setEditTitle(data.title);
        setEditDescription(data.description || "");
        // Load existing questions from document
        if (data.questions && Array.isArray(data.questions)) {
          setQuestions(data.questions);
        }
        // If text extraction is still running, poll for completion
        if (data.processing_status === "processing" || data.processing_status === "pending") {
          startPolling();
        }
      }
      setLoading(false);
    }
    fetchDoc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Poll for OCR text extraction completion
  function startPolling() {
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
  }

  // Retry OCR text extraction
  async function handleRetryExtraction() {
    setDoc((prev) =>
      prev ? { ...prev, processing_status: "processing" as DocumentProcessingStatus, processing_error: null } : prev
    );

    try {
      const res = await fetch(`/api/documents/${id}/process`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start extraction");
      }
      toast.info("Text extraction started...");
      startPolling();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Extraction failed";
      setDoc((prev) =>
        prev ? { ...prev, processing_status: "failed" as DocumentProcessingStatus, processing_error: message } : prev
      );
      toast.error(message);
    }
  }

  // On-demand: Generate Summary
  async function handleSummarize() {
    setSummarizing(true);
    try {
      const res = await fetch(`/api/documents/${id}/summarize`, {
        method: "POST",
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

  // On-demand: Generate Quiz Questions
  async function handleGenerateQuiz() {
    setGeneratingQuiz(true);
    try {
      const res = await fetch(`/api/documents/${id}/generate-questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 5, difficulty: "medium" }),
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

  if (authLoading || loading) return <FullPageSpinner />;

  if (!doc) {
    return (
      <div className="p-6 sm:p-8 text-center py-20">
        <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">Document not found</p>
        <BackButton />
      </div>
    );
  }

  const isExtracting = doc.processing_status === "processing" || doc.processing_status === "pending";
  const isReady = doc.processing_status === "completed";
  const isFailed = doc.processing_status === "failed";

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-4xl">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <BackButton />
        <div className="flex gap-2">
          {doc.download_url && (
            <a href={doc.download_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1.5" />
                Download
              </Button>
            </a>
          )}
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => setShowDelete(true)}
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Document Info Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              {editing ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="title" className="text-xs">Title</Label>
                    <Input
                      id="title"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="description" className="text-xs">Description</Label>
                    <Textarea
                      id="description"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                      placeholder="Add a description..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSave} disabled={saving}>
                      <Save className="h-3.5 w-3.5 mr-1.5" />
                      {saving ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditing(false);
                        setEditTitle(doc.title);
                        setEditDescription(doc.description || "");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <CardTitle className="text-xl">{doc.title}</CardTitle>
                  {doc.description && (
                    <p className="text-sm text-slate-500">{doc.description}</p>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(true)}
                    className="text-xs text-slate-400 hover:text-slate-600 -ml-2 mt-1"
                  >
                    Edit details
                  </Button>
                </>
              )}
            </div>
            <Badge
              variant="outline"
              className={statusColors[doc.processing_status]}
            >
              {isExtracting && (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              )}
              {isReady && (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              )}
              {isFailed && (
                <AlertCircle className="h-3 w-3 mr-1" />
              )}
              {statusLabels[doc.processing_status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-400 mb-0.5">File</p>
              <p className="font-medium text-slate-700 truncate">{doc.file_name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Size</p>
              <p className="font-medium text-slate-700 flex items-center gap-1">
                <Upload className="h-3 w-3" />
                {formatFileSize(doc.file_size)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Uploaded</p>
              <p className="font-medium text-slate-700 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(doc.created_at)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Processed</p>
              <p className="font-medium text-slate-700">
                {doc.processed_at ? formatDate(doc.processed_at) : "—"}
              </p>
            </div>
          </div>

          {/* Extraction failure message */}
          {isFailed && doc.processing_error && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {doc.processing_error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Text extraction in progress */}
      {isExtracting && (
        <Card className="border-blue-100 bg-blue-50/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
              <div>
                <p className="text-sm font-medium text-blue-700">
                  Extracting text from your document...
                </p>
                <p className="text-xs text-blue-500 mt-0.5">
                  This runs automatically after upload. You&apos;ll be able to summarize and generate quizzes once done.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Extraction failed — retry */}
      {isFailed && (
        <Card className="border-red-100 bg-red-50/50">
          <CardContent className="p-5 text-center">
            <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-red-700 mb-1">
              Text Extraction Failed
            </p>
            {doc.processing_error && (
              <p className="text-xs text-red-500 mb-4">{doc.processing_error}</p>
            )}
            <Button variant="outline" onClick={handleRetryExtraction}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Extraction
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Ready: AI Actions ────────────────────────────────────── */}
      {isReady && (
        <>
          {/* Action buttons row */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleSummarize}
              disabled={summarizing}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {summarizing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <BookOpen className="h-4 w-4 mr-2" />
              )}
              {summarizing
                ? "Summarizing..."
                : doc.ai_summary
                  ? "Regenerate Summary"
                  : "Summarize PDF"}
            </Button>
            <Button
              onClick={handleGenerateQuiz}
              disabled={generatingQuiz}
              variant="outline"
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              {generatingQuiz ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Brain className="h-4 w-4 mr-2" />
              )}
              {generatingQuiz
                ? "Generating Quiz..."
                : questions.length > 0
                  ? "Regenerate Quiz"
                  : "Generate Quiz"}
            </Button>
          </div>

          {/* AI Summary */}
          {doc.ai_summary && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-indigo-500" />
                    AI Summary
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(doc.ai_summary!)}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Copy
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {doc.ai_summary}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Generated Questions */}
          {questions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-purple-500" />
                    AI-Generated Questions
                    <Badge variant="secondary" className="ml-1">
                      {questions.length}
                    </Badge>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="p-3 rounded-lg bg-slate-50 border border-slate-100"
                    >
                      <p className="text-sm font-medium text-slate-700 mb-2">
                        {idx + 1}. {q.question}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 ml-4">
                        {q.options.map((opt, optIdx) => (
                          <p
                            key={optIdx}
                            className={`text-xs px-2 py-1 rounded ${
                              optIdx === q.correct_answer
                                ? "bg-emerald-50 text-emerald-700 font-medium"
                                : "text-slate-500"
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}. {opt}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Extracted Text */}
          {doc.extracted_text && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-500" />
                    Extracted Text
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(doc.extracted_text!)}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Copy
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-80 overflow-y-auto rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {doc.extracted_text}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{doc.title}&quot; and its
              uploaded file. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
