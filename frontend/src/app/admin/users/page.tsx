"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Users, Search, Edit2, ShieldAlert, ShieldCheck, Loader2, Trash2, X, CheckCircle2, XCircle
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/ui/back-button";
import { FullPageSpinner } from "@/components/loading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

type Department = { id: string; name: string };
type JobLevel = { id: string; name: string };

type User = {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  employee_id: string | null;
  is_active: boolean;
  verification_status: string;
  created_at: string;
  department: Department | null;
  job_level: JobLevel | null;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobLevels, setJobLevels] = useState<JobLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  
  // Current selection state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  
  // Edit Form state
  const [formData, setFormData] = useState({
    department_id: "",
    job_level_id: "",
    employee_id: ""
  });
  
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setIsLoading(true);
    try {
      const [usersRes, deptsRes, levelsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/departments"),
        fetch("/api/admin/job-levels")
      ]);
      
      if (!usersRes.ok || !deptsRes.ok || !levelsRes.ok) {
        throw new Error("Failed to load management data");
      }
      
      setUsers(await usersRes.json());
      setDepartments(await deptsRes.json());
      setJobLevels(await levelsRes.json());
    } catch (err) {
      toast.error("Failed to fetch necessary data.");
    } finally {
      setIsLoading(false);
    }
  }

  // Memoized filtering
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.employee_id?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDept = deptFilter === "all" || user.department?.id === deptFilter;
      const matchesStatus = statusFilter === "all" 
        || (statusFilter === "active" && user.is_active)
        || (statusFilter === "inactive" && !user.is_active);
        
      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [users, searchTerm, deptFilter, statusFilter]);

  function openEditModal(user: User) {
    setSelectedUser(user);
    setFormData({
      department_id: user.department?.id || "",
      job_level_id: user.job_level?.id || "",
      employee_id: user.employee_id || ""
    });
    setIsEditOpen(true);
  }

  function openStatusModal(user: User) {
    setSelectedUser(user);
    setIsStatusOpen(true);
  }

  function openVerifyModal(user: User) {
    setSelectedUser(user);
    setRejectionReason("");
    setIsVerifyOpen(true);
  }

  async function handleApprove() {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/verifications/${selectedUser.id}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to approve");
      toast.success(`${selectedUser.full_name} has been verified as an employee.`);
      setIsVerifyOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReject() {
    if (!selectedUser || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/verifications/${selectedUser.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectionReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject");
      toast.success(`Verification request for ${selectedUser.full_name} has been rejected.`);
      setIsVerifyOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEditSubmit() {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department_id: formData.department_id || null,
          job_level_id: formData.job_level_id || null,
          employee_id: formData.employee_id || null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update user");
      
      toast.success("User updated");
      setIsEditOpen(false);
      fetchData(); 
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatusToggle() {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      const action = selectedUser.is_active ? "deactivate" : "reactivate";
      const res = await fetch(`/api/admin/users/${selectedUser.id}/${action}`, {
        method: "POST"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action} user`);
      
      toast.success(`User ${action}d successfully`);
      setIsStatusOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <FullPageSpinner />;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="mt-1"><BackButton /></div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-4">Manage Users</h1>
          <p className="text-sm text-slate-500 mt-1">
            View and manage all members within your organization.
          </p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex-1 relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
           <Input 
             placeholder="Search by name, email, or Employee ID..." 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="pl-9 h-10 w-full bg-slate-50"
           />
        </div>
        <div className="w-full sm:w-48">
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="h-10 bg-slate-50">
              <SelectValue placeholder="Department Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(d => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-40">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 bg-slate-50">
              <SelectValue placeholder="Status Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Users className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No users found</h3>
            <p className="text-slate-500 mt-1">Check your filter combinations or clear them to see all users.</p>
            {(searchTerm || deptFilter !== "all" || statusFilter !== "all") && (
              <Button 
                variant="outline" 
                className="mt-6"
                onClick={() => { setSearchTerm(""); setDeptFilter("all"); setStatusFilter("all"); }}
              >
                <X className="h-4 w-4 mr-2" /> Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">Role / Verification</th>
                <th className="px-6 py-4">Organizational Info</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 border border-indigo-200 overflow-hidden">
                        {user.avatar_url ? (
                           <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                           user.full_name?.charAt(0).toUpperCase() || "?"
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{user.full_name || "Unknown"}</div>
                        <div className="text-slate-500 text-xs">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1.5">
                       <Badge variant="outline" className="font-mono text-[10px] tracking-wider uppercase bg-slate-50 text-slate-600 border-slate-200">
                         {user.role}
                       </Badge>
                       {user.verification_status === 'verified' ? (
                          <div className="flex items-center text-[10px] uppercase font-bold text-emerald-600 tracking-wider">
                            <ShieldCheck className="h-3 w-3 mr-1" /> Verified
                          </div>
                       ) : (
                          <div className="flex items-center text-[10px] uppercase font-bold text-amber-600 tracking-wider">
                            <ShieldAlert className="h-3 w-3 mr-1" /> {user.verification_status}
                          </div>
                       )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="space-y-0.5">
                       <div className="font-medium text-slate-700">
                         {user.department?.name || <span className="text-slate-400 italic">No Dept</span>}
                       </div>
                       <div className="text-xs text-slate-500">
                         {user.job_level?.name || "No Level"} 
                         {user.employee_id && <span className="opacity-60 ml-1">· ID: {user.employee_id}</span>}
                       </div>
                     </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span 
                      className={`inline-flex items-center justify-center h-6 px-2.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        user.is_active 
                          ? "bg-emerald-100 text-emerald-800" 
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="ghost" size="icon" 
                      onClick={() => openEditModal(user)} 
                      className="h-8 w-8 text-slate-400 hover:text-indigo-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    {user.is_active ? (
                       <Button 
                         variant="ghost" size="icon" 
                         onClick={() => openStatusModal(user)} 
                         className="h-8 w-8 text-slate-400 hover:text-red-600"
                         title="Deactivate User"
                       >
                         <Trash2 className="h-4 w-4" />
                       </Button>
                    ) : (
                       <Button 
                         variant="ghost" size="icon" 
                         onClick={() => openStatusModal(user)} 
                         className="h-8 w-8 text-slate-400 hover:text-emerald-600"
                         title="Reactivate User"
                       >
                         <ShieldCheck className="h-4 w-4" />
                       </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* --- MODALS --- */}

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Employee Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select value={formData.department_id} onValueChange={(v) => setFormData({...formData, department_id: v})}>
                 <SelectTrigger>
                    <SelectValue placeholder="Select Department" />
                 </SelectTrigger>
                 <SelectContent>
                    {departments.map(d => (
                       <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                 </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">Job Level</Label>
              <Select value={formData.job_level_id} onValueChange={(v) => setFormData({...formData, job_level_id: v})}>
                 <SelectTrigger>
                    <SelectValue placeholder="Select Job Level" />
                 </SelectTrigger>
                 <SelectContent>
                    {jobLevels.map(l => (
                       <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                 </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Employee ID</Label>
              <Input 
                id="employee_id" 
                placeholder="e.g. EMP-12345" 
                value={formData.employee_id} 
                onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSubmit} disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Modal */}
      <AlertDialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
               {selectedUser?.is_active ? "Deactivate User" : "Reactivate User"}
            </AlertDialogTitle>
            <AlertDialogDescription>
               {selectedUser?.is_active ? (
                  <>Are you sure you want to deactivate <strong>{selectedUser?.full_name}</strong>? They will no longer be able to log in or access organizational resources until reactivated.</>
               ) : (
                  <>Are you sure you want to reactivate <strong>{selectedUser?.full_name}</strong>? They will regain access to their account immediately.</>
               )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
               onClick={handleStatusToggle} 
               className={selectedUser?.is_active ? "bg-red-600 hover:bg-red-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : (selectedUser?.is_active ? "Deactivate" : "Reactivate")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Verification Review Modal */}
      <Dialog open={isVerifyOpen} onOpenChange={setIsVerifyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Review Verification Request</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Name</span>
                  <span className="font-semibold text-slate-900">{selectedUser.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Email</span>
                  <span className="text-slate-700">{selectedUser.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Department</span>
                  <span className="text-slate-700">{selectedUser.department?.name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Job Level</span>
                  <span className="text-slate-700">{selectedUser.job_level?.name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Employee ID</span>
                  <span className="text-slate-700">{selectedUser.employee_id || "—"}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rejection_reason" className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Rejection Reason <span className="text-slate-400 normal-case font-normal">(required only if rejecting)</span>
                </Label>
                <Textarea
                  id="rejection_reason"
                  placeholder="Explain why the request is being rejected..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="resize-none bg-slate-50 border-slate-100"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setIsVerifyOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={isSubmitting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
              Reject
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
