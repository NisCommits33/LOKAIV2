/**
 * dashboard/documents/[id]/page.tsx — Document Detail
 *
 * Shows full document metadata, download link, processing status,
 * extracted text preview, AI summary, and edit/delete actions.
 *
 * @module app/dashboard/documents/[id]
 */

"use client";

import { useState, useEffect, use } from "react";
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
  pending: "Pending Processing",
  processing: "Processing...",
  completed: "Ready",
  failed: "Processing Failed",
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

  useEffect(() => {
    async function fetchDoc() {
      const res = await fetch(`/api/documents/${id}`);
      if (res.ok) {
        const data = await res.json();
        setDoc(data);
        setEditTitle(data.title);
        setEditDescription(data.description || "");
      }
      setLoading(false);
    }
    fetchDoc();
  }, [id]);

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
              {doc.processing_status === "processing" && (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              )}
              {doc.processing_status === "completed" && (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              )}
              {doc.processing_status === "failed" && (
                <AlertCircle className="h-3 w-3 mr-1" />
              )}
              {doc.processing_status === "pending" && (
                <Clock className="h-3 w-3 mr-1" />
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

          {/* Processing failure message */}
          {doc.processing_status === "failed" && doc.processing_error && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {doc.processing_error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Summary — shown when processing is complete */}
      {doc.processing_status === "completed" && doc.ai_summary && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-indigo-500" />
              AI Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
              {doc.ai_summary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Extracted text preview — shown when processing is complete */}
      {doc.processing_status === "completed" && doc.extracted_text && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-500" />
              Extracted Text
            </CardTitle>
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

      {/* Pending processing notice */}
      {doc.processing_status === "pending" && (
        <Card className="border-amber-100 bg-amber-50/50">
          <CardContent className="p-5 text-center">
            <Clock className="h-8 w-8 text-amber-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-amber-700">
              Waiting for AI processing
            </p>
            <p className="text-xs text-amber-500 mt-1">
              Text extraction, summarization, and question generation will appear here once processed.
            </p>
          </CardContent>
        </Card>
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
