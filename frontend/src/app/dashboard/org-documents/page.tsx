"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FullPageSpinner } from "@/components/loading";
import {
  Search,
  Eye,
  Clock,
  Upload,
  Layers,
  Building2,
  Tags
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { PersonalDocument } from "@/types/database";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
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

type EmployeeOrgDocListType = PersonalDocument & {
  department_id: string | null;
  policy_tag: string | null;
  chapter_tag: string | null;
};

export default function EmployeeOrgDocumentsPage() {
  const { dbUser, isLoading: authLoading } = useAuth();
  const [documents, setDocuments] = useState<EmployeeOrgDocListType[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState("");

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    params.set("status", "completed"); // Employees only see completed docs ready for learning

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
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchDocuments, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchDocuments]);

  if (authLoading) return <FullPageSpinner />;

  if (!dbUser?.organization_id) {
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        Access Denied: You must belong to an organization to view shared documents.
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Learning Library</h1>
          <p className="text-sm text-slate-500 font-medium">
            Browse your department&apos;s authoritative documents and learning materials.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="w-full md:flex-1 space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Search Title</label>
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
      </div>

      {/* Document Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-slate-100 border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
          <Layers className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-900">No learning materials found</h3>
          <p className="text-sm font-medium text-slate-500 mt-1 max-w-sm mx-auto">
            {search 
              ? "No specific documents match your search."
              : "Your organization hasn't published any documents for your department yet."}
          </p>
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
                <Card className="group hover:shadow-md transition-all border-slate-200 h-full flex flex-col justify-between cursor-pointer">
                  <Link href={`/dashboard/org-documents/${doc.id}`} className="flex-1 flex flex-col">
                      <CardContent className="p-5 space-y-4 flex-1 flex flex-col">
                        <div className="flex items-start justify-between">
                             {/* Category indicators */}
                             <div className="flex flex-wrap gap-1.5">
                               {doc.department_id ? (
                                  <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0 items-center hide-border">
                                     <Building2 className="w-2.5 h-2.5 mr-1" />
                                     Your Dept
                                  </Badge>
                               ) : (
                                  <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 text-[10px] px-1.5 py-0 border-indigo-100">
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
                           <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="h-7 w-7 rounded-sm flex items-center justify-center bg-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 sm:bg-transparent">
                                 <Eye className="h-3.5 w-3.5" />
                              </div>
                           </div>
                        </div>

                        {/* Title + filename */}
                        <div className="mt-2 flex-1">
                          <h3 className="font-bold text-slate-900 line-clamp-2 group-hover:text-indigo-600 transition-colors leading-tight">
                            {doc.title}
                          </h3>
                          {doc.description ? (
                              <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                                  {doc.description}
                              </p>
                          ) : (
                              <p className="text-xs text-slate-400 mt-2 font-mono">
                                  {doc.file_name}
                              </p>
                          )}
                        </div>
                      </CardContent>

                      {/* Footer Stats Row */}
                      <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 mt-auto rounded-b-xl">
                        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                          <span className="flex items-center gap-1.5">
                            <Upload className="h-3.5 w-3.5" />
                            {formatFileSize(doc.file_size)}
                          </span>
                          <span className="flex items-center gap-1.5 transform translate-y-px">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDate(doc.created_at)}
                          </span>
                        </div>
                      </div>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
}
