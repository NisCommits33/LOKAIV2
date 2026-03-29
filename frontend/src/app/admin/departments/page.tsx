"use client";

import { useState, useEffect } from "react";
import { Reorder } from "framer-motion";
import { 
  Plus, Edit2, Trash2, GripVertical, AlertCircle, Loader2, Save, FileText, Layout
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

type Department = {
  id: string;
  name: string;
  code: string;
  display_order: number;
  is_active: boolean;
};

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  // Current selection state
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({ name: "", code: "", is_active: true });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasReordered, setHasReordered] = useState(false);
  
  useEffect(() => {
    fetchDepartments();
  }, []);

  async function fetchDepartments() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/departments");
      if (!res.ok) throw new Error("Failed to load departments");
      const data = await res.json();
      setDepartments(data);
      setHasReordered(false);
    } catch (err) {
      toast.error("Failed to load departments.");
    } finally {
      setIsLoading(false);
    }
  }

  function openAddModal() {
    setFormData({ name: "", code: "", is_active: true });
    setSelectedDept(null);
    setIsAddOpen(true);
  }

  function openEditModal(dept: Department) {
    setFormData({ name: dept.name, code: dept.code, is_active: dept.is_active });
    setSelectedDept(dept);
    setIsEditOpen(true);
  }

  function openDeleteModal(dept: Department) {
    setSelectedDept(dept);
    setIsDeleteOpen(true);
  }

  async function handleAddSubmit() {
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error("Name and Code are required");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          display_order: departments.length
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create department");
      
      toast.success("Department created");
      setIsAddOpen(false);
      fetchDepartments();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEditSubmit() {
    if (!selectedDept) return;
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error("Name and Code are required");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/departments/${selectedDept.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          is_active: formData.is_active
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update department");
      
      toast.success("Department updated");
      setIsEditOpen(false);
      fetchDepartments(); // refresh list
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!selectedDept) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/departments/${selectedDept.id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete department");
      
      toast.success("Department deactivated");
      setIsDeleteOpen(false);
      fetchDepartments();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function saveReorder() {
    setIsSubmitting(true);
    try {
      const updates = departments.map((dept, index) => ({
        id: dept.id,
        display_order: index
      }));
      
      const res = await fetch("/api/admin/departments/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates })
      });
      if (!res.ok) throw new Error("Failed to save order");
      
      toast.success("Department order saved");
      setHasReordered(false);
      fetchDepartments();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleReorder = (newOrder: Department[]) => {
    setDepartments(newOrder);
    setHasReordered(true);
  };

  if (isLoading) return <FullPageSpinner />;

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="mt-1"><BackButton /></div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-4">Manage Departments</h1>
          <p className="text-sm text-slate-500 mt-1">
            Create and organize the departments mapping your organization's hierarchy. 
          </p>
        </div>
        <div className="flex gap-3">
          {hasReordered && (
            <Button onClick={saveReorder} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Order
            </Button>
          )}
          <Button onClick={openAddModal} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="h-4 w-4 mr-2" /> Add Department
          </Button>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-4">
        {departments.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Layout className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900">No departments found</h3>
            <p className="text-slate-500 mt-1">Get started by creating your first department.</p>
            <Button onClick={openAddModal} variant="outline" className="mt-4">
              <Plus className="h-4 w-4 mr-2" /> Create Department
            </Button>
          </div>
        ) : (
          <div>
            <div className="flex px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              <div className="w-10"></div>
              <div className="flex-1">Department Name</div>
              <div className="w-24">Code</div>
              <div className="w-20">Status</div>
              <div className="w-24 text-right">Actions</div>
            </div>
            <Reorder.Group axis="y" values={departments} onReorder={handleReorder} className="space-y-2">
              {departments.map((dept) => (
                <Reorder.Item 
                  key={dept.id} 
                  value={dept} 
                  className={`bg-white border rounded-lg shadow-sm p-4 flex items-center gap-4 transition-colors ${!dept.is_active ? 'opacity-60 grayscale' : ''}`}
                >
                  <div className="cursor-grab text-slate-300 hover:text-slate-500 active:cursor-grabbing w-10 flex justify-center shrink-0">
                    <GripVertical className="h-5 w-5" />
                  </div>
                  <div className="flex-1 font-semibold text-slate-800">
                    {dept.name}
                  </div>
                  <div className="w-24 font-mono text-xs text-slate-500">
                    {dept.code}
                  </div>
                  <div className="w-20">
                    <Badge variant="outline" className={dept.is_active ? "border-emerald-200 text-emerald-700 bg-emerald-50" : "border-slate-200 text-slate-500 bg-slate-50"}>
                      {dept.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="w-24 flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(dept)} className="h-8 w-8 text-slate-400 hover:text-indigo-600">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openDeleteModal(dept)} disabled={!dept.is_active} className="h-8 w-8 text-slate-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}
      </div>

      {/* --- MODALS --- */}

      {/* Add / Edit Modal */}
      <Dialog open={isAddOpen || isEditOpen} onOpenChange={(open) => { if (!open) { setIsAddOpen(false); setIsEditOpen(false); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditOpen ? "Edit Department" : "Add New Department"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Department Name <span className="text-red-500">*</span></Label>
              <Input 
                id="name" 
                placeholder="e.g. Finance & Accounting" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Department Code <span className="text-red-500">*</span></Label>
              <Input 
                id="code" 
                placeholder="e.g. FIN" 
                value={formData.code} 
                onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                className="uppercase font-mono"
              />
            </div>
            {isEditOpen && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                <div className="space-y-0.5">
                  <Label>Active Status</Label>
                  <p className="text-xs text-slate-500">Inactive departments cannot be selected by users.</p>
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
              {isEditOpen ? "Save Changes" : "Create Department"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Department</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate <strong>{selectedDept?.name}</strong>? 
              This will not delete existing records, but new users will not be able to join it.
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
