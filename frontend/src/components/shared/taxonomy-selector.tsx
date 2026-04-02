"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";

export interface DocumentTag {
  id: string;
  organization_id: string;
  type: "policy" | "chapter" | "section";
  name: string;
  parent_id: string | null;
}

interface TaxonomySelectorProps {
  onTagsChange: (tags: { policy_tag: string | null; chapter_tag: string | null; section_tag: string | null }) => void;
  initialTags?: { policy_tag: string | null; chapter_tag: string | null; section_tag: string | null };
}

export function TaxonomySelector({ onTagsChange, initialTags }: TaxonomySelectorProps) {
  const { dbUser } = useAuth();
  const [tags, setTags] = useState<DocumentTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(initialTags?.policy_tag || null);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(initialTags?.chapter_tag || null);
  const [selectedSection, setSelectedSection] = useState<string | null>(initialTags?.section_tag || null);

  // States for inline creation
  const [isCreating, setIsCreating] = useState<"policy" | "chapter" | "section" | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    // Report changes back up
    onTagsChange({
      policy_tag: selectedPolicy,
      chapter_tag: selectedChapter,
      section_tag: selectedSection,
    });
  }, [selectedPolicy, selectedChapter, selectedSection]);

  const fetchTags = async () => {
    try {
      const res = await fetch("/api/org/tags");
      if (!res.ok) throw new Error("Failed to fetch tags");
      const data = await res.json();
      setTags(data);
    } catch (err: any) {
      console.error(err);
      toast.error("Could not load organization tags");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTag = async (type: "policy" | "chapter" | "section") => {
    if (!newTagName.trim()) return;

    let parentId = null;
    if (type === "chapter" && selectedPolicy) parentId = selectedPolicy;
    if (type === "section" && selectedChapter) parentId = selectedChapter;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/org/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          name: newTagName.trim(),
          parent_id: parentId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create tag");
      }

      const newTag: DocumentTag = await res.json();
      setTags((prev) => [...prev, newTag]);

      // Auto-select the newly created tag
      if (type === "policy") {
        setSelectedPolicy(newTag.id);
        setSelectedChapter(null); // Reset children
        setSelectedSection(null);
      } else if (type === "chapter") {
        setSelectedChapter(newTag.id);
        setSelectedSection(null);
      } else if (type === "section") {
        setSelectedSection(newTag.id);
      }

      setNewTagName("");
      setIsCreating(null);
      toast.success(`${type} tag created!`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const policies = tags.filter((t) => t.type === "policy");
  const chapters = tags.filter((t) => t.type === "chapter" && (!t.parent_id || t.parent_id === selectedPolicy));
  const sections = tags.filter((t) => t.type === "section" && (!t.parent_id || t.parent_id === selectedChapter));

  if (isLoading) {
    return <div className="text-sm text-slate-500 animate-pulse flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> Loading taxonomies...</div>;
  }

  const renderCreationField = (type: "policy" | "chapter" | "section", label: string) => {
    return (
      <div className="flex items-center gap-2 mt-2">
        <Input
          className="flex-1 min-w-0"
          placeholder={`New ${label} name...`}
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleCreateTag(type);
            }
          }}
          disabled={isSubmitting}
          autoFocus
        />
        <Button
          type="button"
          size="sm"
          onClick={() => handleCreateTag(type)}
          disabled={isSubmitting || !newTagName.trim()}
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => {
            setIsCreating(null);
            setNewTagName("");
          }}
          disabled={isSubmitting}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-4 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4">
      <div className="grid grid-cols-1 gap-4">
        
        {/* POLICY LEVEL */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Category</Label>
            {dbUser?.role === "org_admin" && isCreating !== "policy" && (
              <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setIsCreating("policy")}>
                <Plus className="h-3 w-3 mr-1" /> New
              </Button>
            )}
          </div>
          {isCreating === "policy" ? (
             renderCreationField("policy", "Category")
          ) : (
            <Select
              value={selectedPolicy || "none"}
              onValueChange={(val) => {
                if (val === "none") {
                  setSelectedPolicy(null);
                  setSelectedChapter(null);
                  setSelectedSection(null);
                } else {
                  setSelectedPolicy(val);
                  // Optionally clear children if policy changes
                  const tagChildren = chapters.filter(c => c.parent_id === val);
                  if (!tagChildren.find(c => c.id === selectedChapter)) {
                    setSelectedChapter(null);
                    setSelectedSection(null);
                  }
                }
              }}
            >
              <SelectTrigger className="bg-white dark:bg-slate-900">
                <SelectValue placeholder="Select Category..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-slate-400 italic">None</SelectItem>
                {policies.map((pol) => (
                  <SelectItem key={pol.id} value={pol.id}>
                    {pol.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* CHAPTER LEVEL */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Sub-Category</Label>
            {dbUser?.role === "org_admin" && isCreating !== "chapter" && selectedPolicy && (
               <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setIsCreating("chapter")}>
                 <Plus className="h-3 w-3 mr-1" /> New
               </Button>
            )}
          </div>
          {isCreating === "chapter" ? (
             renderCreationField("chapter", "Sub-Category")
          ) : (
            <Select
              value={selectedChapter || "none"}
              onValueChange={(val) => {
                if (val === "none") {
                  setSelectedChapter(null);
                  setSelectedSection(null);
                } else {
                  setSelectedChapter(val);
                  const tagChildren = sections.filter(s => s.parent_id === val);
                  if (!tagChildren.find(s => s.id === selectedSection)) {
                    setSelectedSection(null);
                  }
                }
              }}
              disabled={!selectedPolicy}
            >
              <SelectTrigger className="bg-white dark:bg-slate-900">
                <SelectValue placeholder={selectedPolicy ? "Select Sub-Category..." : "Select a Category first"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-slate-400 italic">None</SelectItem>
                {chapters.map((chap) => (
                  <SelectItem key={chap.id} value={chap.id}>
                    {chap.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* SECTION LEVEL */}
        <div className="space-y-2">
           <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Specific Tag</Label>
            {dbUser?.role === "org_admin" && isCreating !== "section" && selectedChapter && (
               <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setIsCreating("section")}>
                 <Plus className="h-3 w-3 mr-1" /> New
               </Button>
            )}
          </div>
          {isCreating === "section" ? (
             renderCreationField("section", "Tag")
          ) : (
            <Select
              value={selectedSection || "none"}
              onValueChange={(val) => {
                if (val === "none") setSelectedSection(null);
                else setSelectedSection(val);
              }}
              disabled={!selectedChapter}
            >
              <SelectTrigger className="bg-white dark:bg-slate-900">
                <SelectValue placeholder={selectedChapter ? "Select Tag..." : "Select a Sub-Category first"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-slate-400 italic">None</SelectItem>
                {sections.map((sec) => (
                  <SelectItem key={sec.id} value={sec.id}>
                    {sec.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

      </div>
    </div>
  );
}
