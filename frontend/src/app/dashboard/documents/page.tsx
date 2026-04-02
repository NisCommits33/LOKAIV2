/**
 * dashboard/documents/page.tsx — Personal Documents
 *
 * Document management page with:
 * - Drag-and-drop PDF upload zone
 * - Upload progress feedback
 * - Document card grid with title, size, date, status badge
 * - Search bar, processing status filter
 * - Delete with confirmation dialog
 *
 * @module app/dashboard/documents
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
import {
  FileText,
  Upload,
  Search,
  Trash2,
  Eye,
  Clock,
  FileUp,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { PersonalDocument, DocumentProcessingStatus } from "@/types/database";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

const statusColors: Record<DocumentProcessingStatus, string> = {
  pending: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800",
  processing: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-800",
  completed: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800",
  failed: "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800",
};

const statusLabels: Record<DocumentProcessingStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  completed: "Ready",
  failed: "Failed",
};

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
  });
}

export default function DocumentsPage() {
  const { isLoading: authLoading } = useAuth();
  const [documents, setDocuments] = useState<PersonalDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DocumentProcessingStatus | "">("");

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (statusFilter) params.set("status", statusFilter);

    const res = await fetch(`/api/documents?${params.toString()}`);
    console.log("/api/documents status:", res.status);
    let bodyText = await res.text();
    console.log("/api/documents body:", bodyText);
    let data = null;
    try {
      data = JSON.parse(bodyText);
    } catch (e) {
      console.error("Failed to parse JSON:", e);
    }
    if (res.ok && data) {
      setDocuments(data.documents);
      setTotal(data.total);
    }
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchDocuments, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchDocuments]);

  async function handleUpload(file: File) {
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size exceeds 50 MB limit");
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append("file", file);

    // Simulate progress steps while the upload happens
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 10, 90));
    }, 300);

    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      const newDoc = await res.json();
      console.log("Upload response doc:", newDoc);
      toast.success("Document uploaded — extracting text...");
      // Show modal or toast after upload, do not navigate
      if (newDoc.id) {
        fetchDocuments();
      } else {
        console.error("No document ID returned from upload");
        fetchDocuments();
      }
    } catch {
      clearInterval(progressInterval);
      toast.error("Upload failed. Please try again.");
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = "";
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/documents/${deleteId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Document deleted");
        setDocuments((prev) => prev.filter((d) => d.id !== deleteId));
        setTotal((prev) => prev - 1);
      } else {
        const data = await res.json();
        toast.error(data.error || "Delete failed");
      }
    } catch {
      toast.error("Delete failed. Please try again.");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  if (authLoading) return <FullPageSpinner />;

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          My Documents
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Upload study materials and let AI generate practice questions
        </p>
      </div>

      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragOver
            ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30"
            : "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600"
        }`}
      >
        {uploading ? (
          <div className="space-y-3">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mx-auto" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Uploading...</p>
            <Progress value={uploadProgress} className="max-w-xs mx-auto" />
            <p className="text-xs text-slate-500 dark:text-slate-400">{uploadProgress}%</p>
          </div>
        ) : (
          <div className="space-y-3">
            <FileUp className="h-10 w-10 text-slate-400 mx-auto" />
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Drop your PDF here, or{" "}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold underline underline-offset-2"
                >
                  browse
                </button>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                PDF only, max 50 MB
              </p>
            </div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white dark:bg-slate-900"
          />
        </div>
        <div className="flex gap-2">
          {(["", "pending", "completed", "failed"] as const).map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
              className="text-xs"
            >
              {s === "" ? "All" : statusLabels[s]}
            </Button>
          ))}
        </div>
      </div>

      {/* Document Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-44 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {search || statusFilter
              ? "No documents match your filters"
              : "No documents yet — upload a PDF to get started"}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-400 font-medium">
            {total} document{total !== 1 ? "s" : ""}
          </p>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {documents.map((doc) => (
              <motion.div key={doc.id} variants={item}>
                <Card className="group hover:shadow-md transition-all border-slate-100 dark:border-slate-700">
                  <CardContent className="p-5 space-y-3">
                    {/* Status + actions row */}
                    <div className="flex items-start justify-between">
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
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/dashboard/documents/${doc.id}`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                          onClick={() => setDeleteId(doc.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Title + filename */}
                    <Link href={`/dashboard/documents/${doc.id}`} className="block">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                        {doc.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                        {doc.file_name}
                      </p>
                    </Link>

                    {/* Meta row */}
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Upload className="h-3 w-3" />
                        {formatFileSize(doc.file_size)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(doc.created_at)}
                      </span>
                    </div>

                    {/* Processing error */}
                    {doc.processing_status === "failed" && doc.processing_error && (
                      <p className="text-xs text-red-500 flex items-start gap-1">
                        <X className="h-3 w-3 mt-0.5 shrink-0" />
                        {doc.processing_error}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the document and its uploaded file.
              This action cannot be undone.
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
