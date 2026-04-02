"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FullPageSpinner } from "@/components/loading";
import { DepartmentSelector } from "@/components/selectors/department-selector";
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
  Search,
  Trash2,
  Eye,
  Clock,
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  Building2,
  Tags
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { PersonalDocument, DocumentProcessingStatus, Department } from "@/types/database";

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

// Extending PersonalDocument type just for rendering metadata in the listing
type OrgDocumentListType = PersonalDocument & {
  department_id: string | null;
  policy_tag: string | null;
  chapter_tag: string | null;
};

export default function OrgDocumentsPage() {
  const { dbUser, isLoading: authLoading } = useAuth();
  const [documents, setDocuments] = useState<OrgDocumentListType[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DocumentProcessingStatus | "all">("all");
  const [departmentId, setDepartmentId] = useState<string>("all");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (departmentId && departmentId !== "all") params.set("department_id", departmentId);

    try {
      const res = await fetch(`/api/org/documents?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents);
        setTotal(data.total);
      }
    } catch (e) {
      console.error("Failed to fetch documents", e);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, departmentId]);

  useEffect(() => {
    const timer = setTimeout(fetchDocuments, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchDocuments]);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/org/documents/${deleteId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Document deleted successfully");
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

  if (dbUser?.role !== "org_admin" && dbUser?.role !== "super_admin") {
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        Access Denied: Only Organization Admins can manage the Master Document Library.
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Organization Documents</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Manage your organization&apos;s shared documents
          </p>
        </div>
        <Link href="/admin/documents/upload">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="w-full md:flex-1 space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Search Title</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search library..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
        </div>
        
        <div className="w-full md:w-64 space-y-1.5 min-w-0">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Department</label>
           <DepartmentSelector
              organizationId={dbUser.organization_id ?? undefined}
              value={departmentId}
              onValueChange={setDepartmentId}
              showAllOption={true}
              label=""
            />
        </div>

        <div className="w-full md:w-48 space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</label>
          <select 
            className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-slate-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-100"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Document Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 animate-pulse" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
          <Building2 className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">No organizational documents found</h3>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {search || statusFilter !== "all" || departmentId !== "all"
              ? "Clear your filters to see more results."
              : "Upload documents to make them available to your organization."}
          </p>
          {!(search || statusFilter !== "all" || departmentId !== "all") && (
            <Link href="/admin/documents/upload">
              <Button variant="outline" className="mt-4 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                <Upload className="h-4 w-4 mr-2" />
                Upload First Document
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-400 font-medium px-1">
            Showing {documents.length} of {total} document{total !== 1 ? "s" : ""}
          </p>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {documents.map((doc) => (
              <motion.div key={doc.id} variants={item}>
                <Card className="group hover:shadow-md transition-all border-slate-200 dark:border-slate-700 h-full flex flex-col justify-between">
                  <CardContent className="p-5 space-y-4 flex-1">
                    {/* Status + actions row */}
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col gap-1.5 items-start">
                        <Badge variant="outline" className={`h-5 text-[10px] ${statusColors[doc.processing_status]}`}>
                          {doc.processing_status === "processing" && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                          {doc.processing_status === "completed" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {doc.processing_status === "failed" && <AlertCircle className="h-3 w-3 mr-1" />}
                          {doc.processing_status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                          {statusLabels[doc.processing_status]}
                        </Badge>
                        {(doc as any).is_published ? (
                          <Badge className="bg-indigo-600 text-white border-0 h-5 text-[9px] uppercase tracking-tighter">Published</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 h-5 text-[9px] uppercase tracking-tighter">Draft</Badge>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/admin/documents/${doc.id}`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 sm:bg-transparent">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/30 sm:bg-transparent"
                          onClick={() => setDeleteId(doc.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Title + filename */}
                    <Link href={`/admin/documents/${doc.id}`} className="block">
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
                        {doc.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-1 font-mono">
                        {doc.file_name}
                      </p>
                    </Link>

                    {/* Taxonomies & Tags */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                       {doc.department_id ? (
                          <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] px-1.5 py-0 items-center hide-border">
                             <Building2 className="w-2.5 h-2.5 mr-1" />
                             Dept {doc.department_id.split("-")[0]}
                          </Badge>
                       ) : (
                          <Badge variant="secondary" className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 text-[10px] px-1.5 py-0 border-indigo-100 dark:border-indigo-800">
                             Org-Wide
                          </Badge>
                       )}
                       {doc.policy_tag && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-slate-500 items-center">
                             <Tags className="w-2.5 h-2.5 mr-1" />
                             {doc.policy_tag}
                          </Badge>
                       )}
                    </div>
                  </CardContent>

                  {/* Footer Stats Row */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 px-5 py-3 border-t border-slate-100 dark:border-slate-700 mt-auto rounded-b-xl">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Upload className="h-3.5 w-3.5" />
                        {formatFileSize(doc.file_size)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(doc.created_at)}
                      </span>
                    </div>
                  </div>
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
            <AlertDialogTitle>Delete Organization Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the document from the library and delete the underlying file from storage. 
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
              {deleting ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
