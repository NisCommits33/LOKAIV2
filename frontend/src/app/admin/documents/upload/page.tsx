"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { FullPageSpinner } from "@/components/loading";
import { DepartmentSelector } from "@/components/selectors/department-selector";
import { TaxonomySelector } from "@/components/shared/taxonomy-selector";
import { FileUp, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function OrgDocumentUploadPage() {
  const router = useRouter();
  const { dbUser, isLoading: authLoading } = useAuth();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("all");
  const [tags, setTags] = useState<{ policy_tag: string | null; chapter_tag: string | null; section_tag: string | null }>({
    policy_tag: null,
    chapter_tag: null,
    section_tag: null
  });

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (authLoading) return <FullPageSpinner />;

  if (dbUser?.role !== "org_admin" && dbUser?.role !== "super_admin") {
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        Access Denied: Only Organization Admins can upload to the Master Document Library.
      </div>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.type !== "application/pdf") {
        toast.error("Only PDF files are allowed.");
        return;
      }
      if (selected.size > 50 * 1024 * 1024) {
        toast.error("File exceeds 50MB limit.");
        return;
      }
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.pdf$/i, ""));
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const selected = e.dataTransfer.files[0];
    if (selected) {
      if (selected.type !== "application/pdf") {
        toast.error("Only PDF files are allowed.");
        return;
      }
      if (selected.size > 50 * 1024 * 1024) {
        toast.error("File exceeds 50MB limit.");
        return;
      }
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.pdf$/i, ""));
      }
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Please select a PDF file to upload.");
      return;
    }
    if (!title.trim()) {
      toast.error("Please enter a document title.");
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("department_id", departmentId);
    
    if (tags.policy_tag) formData.append("policy_tag", tags.policy_tag);
    if (tags.chapter_tag) formData.append("chapter_tag", tags.chapter_tag);
    if (tags.section_tag) formData.append("section_tag", tags.section_tag);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 10, 90));
    }, 300);

    try {
      const res = await fetch("/api/org/documents", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        let errorMsg = "Failed to upload document";
        try {
          const err = await res.json();
          errorMsg = err.error || errorMsg;
        } catch {
          // Response body may be empty or not JSON
        }
        throw new Error(errorMsg);
      }

      setUploadProgress(100);
      toast.success("Document uploaded successfully! AI extraction starting...");
      
      // Give the user a second to see the 100% progress before redirecting
      setTimeout(() => {
        router.push("/admin/documents");
      }, 1000);

    } catch (err: any) {
      clearInterval(progressInterval);
      toast.error(err.message);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/documents">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Upload Document</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Add a new file to the organization library.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Upload & Basic Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Source File</CardTitle>
              <CardDescription>Upload the canonical PDF version of the document.</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
                className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
                  dragOver ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30" : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
                } ${file ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" : ""}`}
                onClick={() => !file && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                
                {file ? (
                  <div className="text-center space-y-2">
                    <FileUp className="h-8 w-8 text-emerald-500 mx-auto" />
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{file.name}</p>
                    <p className="text-xs text-emerald-600/70 dark:text-emerald-500/70">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                      Remove File
                    </Button>
                  </div>
                ) : (
                  <div className="text-center space-y-2 pointer-events-none">
                    <FileUp className="h-8 w-8 text-slate-400 mx-auto" />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Drop PDF here or click to browse</p>
                    <p className="text-xs text-slate-400">Up to 50MB</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Document Title <span className="text-red-500">*</span></Label>
                <Input placeholder="e.g. Employee Handbook 2024" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Description <span className="text-slate-400 font-normal">(Optional)</span></Label>
                <Textarea 
                  placeholder="Brief summary of what this document covers..." 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-24"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Categories */}
        <div className="space-y-6">
          <Card>
             <CardHeader>
              <CardTitle>Department Access</CardTitle>
              <CardDescription>Who should this apply to?</CardDescription>
            </CardHeader>
            <CardContent>
               <DepartmentSelector
                  organizationId={dbUser?.organization_id ?? undefined}
                  value={departmentId}
                  onValueChange={setDepartmentId}
                  showAllOption={true}
                  label=""
                />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>Assign tags to organize this document.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="-mx-1">
                 <TaxonomySelector onTagsChange={setTags} />
              </div>
            </CardContent>
          </Card>

          <div className="pt-4 space-y-3">
             {uploading && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                     <span>Uploading & Processing</span>
                     <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
             )}
             
             <Button 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" 
                size="lg"
                onClick={handleSubmit}
                disabled={uploading || !file || !title}
             >
                {uploading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
                ) : (
                  <><FileUp className="mr-2 h-4 w-4" /> Upload Document</>
                )}
             </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
