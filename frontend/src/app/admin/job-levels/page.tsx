"use client";

import { useState, useEffect } from "react";
import { Reorder } from "framer-motion";
import { 
  Plus, Edit2, Trash2, GripVertical, AlertCircle, Loader2, Save, Layers, ArrowDownUp
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/ui/back-button";
import { FullPageSpinner } from "@/components/loading";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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

type JobLevel = {
  id: string;
  name: string;
  level_order: number;
  is_active: boolean;
};

export default function AdminJobLevelsPage() {
  const [jobLevels, setJobLevels] = useState<JobLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  // Current selection state
  const [selectedLevel, setSelectedLevel] = useState<JobLevel | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({ name: "", is_active: true });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasReordered, setHasReordered] = useState(false);
  
  useEffect(() => {
    fetchJobLevels();
  }, []);

  async function fetchJobLevels() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/job-levels");
      if (!res.ok) throw new Error("Failed to load job levels");
      const data = await res.json();
      setJobLevels(data);
      setHasReordered(false);
    } catch (err) {
      toast.error("Failed to load job levels.");
    } finally {
      setIsLoading(false);
    }
  }

  function openAddModal() {
    setFormData({ name: "", is_active: true });
    setSelectedLevel(null);
    setIsAddOpen(true);
  }

  function openEditModal(level: JobLevel) {
    setFormData({ name: level.name, is_active: level.is_active });
    setSelectedLevel(level);
    setIsEditOpen(true);
  }

  function openDeleteModal(level: JobLevel) {
    setSelectedLevel(level);
    setIsDeleteOpen(true);
  }

  async function handleAddSubmit() {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/job-levels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          level_order: jobLevels.length
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create job level");
      
      toast.success("Job Level created");
      setIsAddOpen(false);
      fetchJobLevels();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEditSubmit() {
    if (!selectedLevel) return;
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/job-levels/${selectedLevel.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          is_active: formData.is_active
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update job level");
      
      toast.success("Job Level updated");
      setIsEditOpen(false);
      fetchJobLevels(); 
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!selectedLevel) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/job-levels/${selectedLevel.id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to deactivate job level");
      
      toast.success("Job Level deactivated");
      setIsDeleteOpen(false);
      fetchJobLevels();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function saveReorder() {
    setIsSubmitting(true);
    try {
      const updates = jobLevels.map((level, index) => ({
        id: level.id,
        level_order: index
      }));
      
      const res = await fetch("/api/admin/job-levels/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates })
      });
      if (!res.ok) throw new Error("Failed to save order");
      
      toast.success("Job Level order saved");
      setHasReordered(false);
      fetchJobLevels();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleReorder = (newOrder: JobLevel[]) => {
    setJobLevels(newOrder);
    setHasReordered(true);
  };

  if (isLoading) return <FullPageSpinner />;

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-6">
        <div>
          <div className="mt-1"><BackButton /></div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-4">Manage Job Levels</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Define and reorder the seniority ranking of positions in your organization. (Top is Lowest Rank, Bottom is Highest Rank)
          </p>
        </div>
        <div className="flex gap-3">
          {hasReordered && (
            <Button onClick={saveReorder} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Hierarchy
            </Button>
          )}
          <Button onClick={openAddModal} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="h-4 w-4 mr-2" /> Add Level
          </Button>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 sm:p-4">
        {jobLevels.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Layers className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No Job Levels Found</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Start by creating the base title of employment.</p>
            <Button onClick={openAddModal} variant="outline" className="mt-4">
              <Plus className="h-4 w-4 mr-2" /> Create Job Level
            </Button>
          </div>
        ) : (
          <div>
            <div className="flex px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 items-center">
              <div className="w-10"></div>
              <div className="w-16"><ArrowDownUp className="h-3 w-3 inline mr-1 text-slate-300" /> Rank</div>
              <div className="flex-1">Level Name</div>
              <div className="w-20">Status</div>
              <div className="w-24 text-right">Actions</div>
            </div>
            <Reorder.Group axis="y" values={jobLevels} onReorder={handleReorder} className="space-y-2 relative">
              <div className="absolute left-9 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700 z-0"></div>
              {jobLevels.map((level, index) => (
                <Reorder.Item 
                  key={level.id} 
                  value={level} 
                  className={`relative z-10 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-sm p-4 flex items-center gap-4 transition-colors ${!level.is_active ? 'opacity-60 grayscale' : ''}`}
                >
                  <div className="cursor-grab text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 active:cursor-grabbing w-10 flex justify-center shrink-0">
                    <GripVertical className="h-5 w-5" />
                  </div>
                  <div className="w-16 flex items-center justify-center">
                     <span className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-[10px] font-black font-mono text-slate-500 dark:text-slate-400">
                        {index + 1}
                     </span>
                  </div>
                  <div className="flex-1 font-semibold text-slate-800 dark:text-slate-200">
                    {level.name}
                  </div>
                  <div className="w-20">
                    <Badge variant="outline" className={level.is_active ? "border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30" : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800"}>
                      {level.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="w-24 flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(level)} className="h-8 w-8 text-slate-400 hover:text-indigo-600">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openDeleteModal(level)} disabled={!level.is_active} className="h-8 w-8 text-slate-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
            <div className="px-5 mt-4 text-[11px] text-slate-500 font-medium">
               Drag and drop items directly to restructure your organizational reporting hierarchy. Order goes from Ground (1) to Top Leadership.
            </div>
          </div>
        )}
      </div>

      {/* --- MODALS --- */}

      {/* Add / Edit Modal */}
      <Dialog open={isAddOpen || isEditOpen} onOpenChange={(open) => { if (!open) { setIsAddOpen(false); setIsEditOpen(false); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditOpen ? "Edit Job Level" : "Add New Job Level"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Job Level Name <span className="text-red-500">*</span></Label>
              <Input 
                id="name" 
                placeholder="e.g. Senior Officer, Director, Ground Staff..." 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
              />
            </div>
            {isEditOpen && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                <div className="space-y-0.5">
                  <Label>Active Status</Label>
                  <p className="text-xs text-slate-500">Inactive job levels cannot be assigned to users.</p>
                </div>
                <Switch 
                  checked={formData.is_active} 
                  onCheckedChange={(checked) => setFormData({...formData, is_active: checked})} 
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}>Cancel</Button>
            <Button onClick={isEditOpen ? handleEditSubmit : handleAddSubmit} disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {isEditOpen ? "Save Changes" : "Create Level"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Job Level</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate <strong>{selectedLevel?.name}</strong>? 
              Users with this job level will keep it, but it will be removed from future selection options.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
