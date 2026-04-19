"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Reorder } from "framer-motion";
import {
  Plus, Edit2, Trash2, GripVertical, Loader2, Save, Layout, Layers,
  Users, Search, ShieldAlert, ShieldCheck, X, CheckCircle2, XCircle,
  ArrowDownUp, Building2,
} from "lucide-react";
import { toast } from "sonner";
import { Pagination } from "@/components/ui/pagination";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
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

// ─── Types ───────────────────────────────────────────────────
type Department = {
  id: string;
  name: string;
  code: string;
  display_order: number;
  is_active: boolean;
};

type JobLevel = {
  id: string;
  name: string;
  level_order: number;
  is_active: boolean;
};

type UserRecord = {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  employee_id: string | null;
  is_active: boolean;
  verification_status: string;
  created_at: string;
  department: { id: string; name: string } | null;
  job_level: { id: string; name: string } | null;
};

// ═════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════
export default function ManageTeamPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobLevels, setJobLevels] = useState<JobLevel[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(1);

  async function fetchAll() {
    setIsLoading(true);
    try {
      const [deptsRes, levelsRes] = await Promise.all([
        fetch("/api/admin/departments"),
        fetch("/api/admin/job-levels"),
      ]);
      if (!deptsRes.ok || !levelsRes.ok)
        throw new Error("Failed to load data");

      setDepartments(await deptsRes.json());
      setJobLevels(await levelsRes.json());
    } catch {
      toast.error("Failed to load management data.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  if (isLoading) return <FullPageSpinner />;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Manage Team
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Users, departments, and job levels — all in one place.
        </p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="w-full sm:w-auto bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <TabsTrigger value="users" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm rounded-lg px-5 py-2 text-sm font-bold">
            <Users className="h-4 w-4" /> Users
            <Badge variant="secondary" className="ml-1 text-[10px] h-5 px-1.5">{totalUsers}</Badge>
          </TabsTrigger>
          <TabsTrigger value="departments" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm rounded-lg px-5 py-2 text-sm font-bold">
            <Building2 className="h-4 w-4" /> Departments
            <Badge variant="secondary" className="ml-1 text-[10px] h-5 px-1.5">{departments.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="job-levels" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm rounded-lg px-5 py-2 text-sm font-bold">
            <Layers className="h-4 w-4" /> Job Levels
            <Badge variant="secondary" className="ml-1 text-[10px] h-5 px-1.5">{jobLevels.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* ── Users Tab ────────────────────────────────────── */}
        <TabsContent value="users" className="mt-6">
          <UsersTab
            departments={departments}
            jobLevels={jobLevels}
            onTotalUpdate={setTotalUsers}
          />
        </TabsContent>

        {/* ── Departments Tab ──────────────────────────────── */}
        <TabsContent value="departments" className="mt-6">
          <DepartmentsTab
            departments={departments}
            setDepartments={setDepartments}
            onRefresh={fetchAll}
          />
        </TabsContent>

        {/* ── Job Levels Tab ───────────────────────────────── */}
        <TabsContent value="job-levels" className="mt-6">
          <JobLevelsTab
            jobLevels={jobLevels}
            setJobLevels={setJobLevels}
            onRefresh={fetchAll}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// USERS TAB
// ═════════════════════════════════════════════════════════════
function UsersTab({
  departments,
  jobLevels,
  onTotalUpdate,
}: {
  departments: Department[];
  jobLevels: JobLevel[];
  onTotalUpdate: (total: number) => void;
}) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const limit = 20;

  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [formData, setFormData] = useState({ department_id: "", job_level_id: "", employee_id: "" });

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const offset = (page - 1) * limit;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        search: searchTerm,
        dept: deptFilter,
        status: statusFilter,
      });

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      
      setUsers(data.users);
      setTotal(data.total);
      onTotalUpdate(data.total);
    } catch {
      toast.error("Failed to load users.");
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTerm, deptFilter, statusFilter, onTotalUpdate]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(fetchUsers, searchTerm ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, deptFilter, statusFilter]);

  function openEditModal(user: UserRecord) {
    setSelectedUser(user);
    setFormData({
      department_id: user.department?.id || "",
      job_level_id: user.job_level?.id || "",
      employee_id: user.employee_id || "",
    });
    setIsEditOpen(true);
  }

  function openStatusModal(user: UserRecord) { setSelectedUser(user); setIsStatusOpen(true); }
  function openVerifyModal(user: UserRecord) { setSelectedUser(user); setRejectionReason(""); setIsVerifyOpen(true); }

  async function handleApprove() {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/verifications/${selectedUser.id}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to approve");
      toast.success(`${selectedUser.full_name} has been verified.`);
      setIsVerifyOpen(false);
      fetchUsers();
    } catch (err: any) { toast.error(err.message); }
    finally { setIsSubmitting(false); }
  }

  async function handleReject() {
    if (!selectedUser || !rejectionReason.trim()) { toast.error("Please provide a rejection reason."); return; }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/verifications/${selectedUser.id}/reject`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectionReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject");
      toast.success(`Verification for ${selectedUser.full_name} rejected.`);
      setIsVerifyOpen(false);
      fetchUsers();
    } catch (err: any) { toast.error(err.message); }
    finally { setIsSubmitting(false); }
  }

  async function handleEditSubmit() {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department_id: formData.department_id || null,
          job_level_id: formData.job_level_id || null,
          employee_id: formData.employee_id || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update user");
      toast.success("User updated");
      setIsEditOpen(false);
      fetchUsers();
    } catch (err: any) { toast.error(err.message); }
    finally { setIsSubmitting(false); }
  }

  async function handleStatusToggle() {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      const action = selectedUser.is_active ? "deactivate" : "reactivate";
      const res = await fetch(`/api/admin/users/${selectedUser.id}/${action}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action} user`);
      toast.success(`User ${action}d successfully`);
      setIsStatusOpen(false);
      fetchUsers();
    } catch (err: any) { toast.error(err.message); }
    finally { setIsSubmitting(false); }
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Search by name, email, or Employee ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 h-10 w-full bg-slate-50 dark:bg-slate-800" />
        </div>
        <div className="w-full sm:w-48">
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="h-10 bg-slate-50 dark:bg-slate-800"><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((d) => (<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-40">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 bg-slate-50 dark:bg-slate-800"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-x-auto shadow-sm">
        {isLoading && users.length === 0 ? (
          <div className="p-12 text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">Loading user directory...</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 dark:bg-slate-800/50">
                <TableHead className="w-[300px]">User</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Job Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                    No users found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500">
                          {user.full_name?.charAt(0) || "U"}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{user.full_name || "Unknown User"}</span>
                          <span className="text-xs text-slate-500">{user.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {user.department?.name || "Unassigned"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {user.job_level?.name || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className={user.is_active ? "border-emerald-200 text-emerald-700 bg-emerald-50" : "border-slate-200 text-slate-500 bg-slate-50"}>
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {user.verification_status === "pending" && (
                          <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50 text-[10px] h-4">Pending Verification</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {user.verification_status === "pending" && (
                          <Button variant="ghost" size="icon" onClick={() => openVerifyModal(user)} className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-50">
                            <ShieldAlert className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => openEditModal(user)} className="h-8 w-8 text-slate-400 hover:text-indigo-600">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openStatusModal(user)} className={`h-8 w-8 ${user.is_active ? "text-slate-400 hover:text-red-500" : "text-emerald-500 hover:text-emerald-600"}`}>
                          {user.is_active ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(total / limit)}
            totalItems={total}
            itemsPerPage={limit}
            onPageChange={setPage}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Employee Details</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={formData.department_id} onValueChange={(v) => setFormData({ ...formData, department_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                <SelectContent>{departments.map((d) => (<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Job Level</Label>
              <Select value={formData.job_level_id} onValueChange={(v) => setFormData({ ...formData, job_level_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select Job Level" /></SelectTrigger>
                <SelectContent>{jobLevels.map((l) => (<SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Employee ID</Label>
              <Input placeholder="e.g. EMP-12345" value={formData.employee_id} onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSubmit} disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null} Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Modal */}
      <AlertDialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{selectedUser?.is_active ? "Deactivate User" : "Reactivate User"}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser?.is_active
                ? (<>Are you sure you want to deactivate <strong>{selectedUser?.full_name}</strong>? They will lose access until reactivated.</>)
                : (<>Are you sure you want to reactivate <strong>{selectedUser?.full_name}</strong>? They will regain access immediately.</>)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusToggle} className={selectedUser?.is_active ? "bg-red-600 hover:bg-red-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}>
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : selectedUser?.is_active ? "Deactivate" : "Reactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Verification Modal */}
      <Dialog open={isVerifyOpen} onOpenChange={setIsVerifyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Review Verification Request</DialogTitle></DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500 font-medium">Name</span><span className="font-semibold text-slate-900 dark:text-slate-100">{selectedUser.full_name}</span></div>
                <div className="flex justify-between"><span className="text-slate-500 font-medium">Email</span><span className="text-slate-700 dark:text-slate-300">{selectedUser.email}</span></div>
                <div className="flex justify-between"><span className="text-slate-500 font-medium">Department</span><span className="text-slate-700 dark:text-slate-300">{selectedUser.department?.name || "—"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500 font-medium">Job Level</span><span className="text-slate-700 dark:text-slate-300">{selectedUser.job_level?.name || "—"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500 font-medium">Employee ID</span><span className="text-slate-700 dark:text-slate-300">{selectedUser.employee_id || "—"}</span></div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Rejection Reason <span className="text-slate-400 normal-case font-normal">(required only if rejecting)</span></Label>
                <Textarea placeholder="Explain why the request is being rejected..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="resize-none bg-slate-50 dark:bg-slate-800" rows={3} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setIsVerifyOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleReject} disabled={isSubmitting} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />} Reject
            </Button>
            <Button onClick={handleApprove} disabled={isSubmitting} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />} Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ═════════════════════════════════════════════════════════════
// DEPARTMENTS TAB
// ═════════════════════════════════════════════════════════════
function DepartmentsTab({
  departments,
  setDepartments,
  onRefresh,
}: {
  departments: Department[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  onRefresh: () => void;
}) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ name: "", code: "", is_active: true });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasReordered, setHasReordered] = useState(false);

  function openAddModal() { setFormData({ name: "", code: "", is_active: true }); setSelectedDept(null); setIsAddOpen(true); }
  function openEditModal(dept: Department) { setFormData({ name: dept.name, code: dept.code, is_active: dept.is_active }); setSelectedDept(dept); setIsEditOpen(true); }
  function openDeleteModal(dept: Department) { setSelectedDept(dept); setIsDeleteOpen(true); }

  async function handleAddSubmit() {
    if (!formData.name.trim() || !formData.code.trim()) { toast.error("Name and Code are required"); return; }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/departments", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name.trim(), code: formData.code.trim().toUpperCase(), display_order: departments.length }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create department");
      toast.success("Department created");
      setIsAddOpen(false);
      onRefresh();
    } catch (err: any) { toast.error(err.message); }
    finally { setIsSubmitting(false); }
  }

  async function handleEditSubmit() {
    if (!selectedDept || !formData.name.trim() || !formData.code.trim()) { toast.error("Name and Code are required"); return; }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/departments/${selectedDept.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name.trim(), code: formData.code.trim().toUpperCase(), is_active: formData.is_active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update department");
      toast.success("Department updated");
      setIsEditOpen(false);
      onRefresh();
    } catch (err: any) { toast.error(err.message); }
    finally { setIsSubmitting(false); }
  }

  async function handleDelete() {
    if (!selectedDept) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/departments/${selectedDept.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to deactivate department");
      toast.success("Department deactivated");
      setIsDeleteOpen(false);
      onRefresh();
    } catch (err: any) { toast.error(err.message); }
    finally { setIsSubmitting(false); }
  }

  async function saveReorder() {
    setIsSubmitting(true);
    try {
      const updates = departments.map((dept, index) => ({ id: dept.id, display_order: index }));
      const res = await fetch("/api/admin/departments/reorder", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      if (!res.ok) throw new Error("Failed to save order");
      toast.success("Department order saved");
      setHasReordered(false);
      onRefresh();
    } catch (err: any) { toast.error(err.message); }
    finally { setIsSubmitting(false); }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Create and organize the departments mapping your organization&apos;s hierarchy.
        </p>
        <div className="flex gap-3">
          {hasReordered && (
            <Button onClick={saveReorder} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save Order
            </Button>
          )}
          <Button onClick={openAddModal} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="h-4 w-4 mr-2" /> Add Department
          </Button>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 sm:p-4">
        {departments.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Layout className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No departments found</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Get started by creating your first department.</p>
            <Button onClick={openAddModal} variant="outline" className="mt-4"><Plus className="h-4 w-4 mr-2" /> Create Department</Button>
          </div>
        ) : (
          <div>
            <div className="flex px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
              <div className="w-10"></div>
              <div className="flex-1">Department Name</div>
              <div className="w-24">Code</div>
              <div className="w-20">Status</div>
              <div className="w-24 text-right">Actions</div>
            </div>
            <Reorder.Group axis="y" values={departments} onReorder={(newOrder) => { setDepartments(newOrder); setHasReordered(true); }} className="space-y-2">
              {departments.map((dept) => (
                <Reorder.Item key={dept.id} value={dept} className={`bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-sm p-4 flex items-center gap-4 transition-colors ${!dept.is_active ? "opacity-60 grayscale" : ""}`}>
                  <div className="cursor-grab text-slate-300 dark:text-slate-600 hover:text-slate-500 active:cursor-grabbing w-10 flex justify-center shrink-0"><GripVertical className="h-5 w-5" /></div>
                  <div className="flex-1 font-semibold text-slate-800 dark:text-slate-200">{dept.name}</div>
                  <div className="w-24 font-mono text-xs text-slate-500 dark:text-slate-400">{dept.code}</div>
                  <div className="w-20">
                    <Badge variant="outline" className={dept.is_active ? "border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30" : "border-slate-200 dark:border-slate-700 text-slate-500 bg-slate-50 dark:bg-slate-800"}>
                      {dept.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="w-24 flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(dept)} className="h-8 w-8 text-slate-400 hover:text-indigo-600"><Edit2 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => openDeleteModal(dept)} disabled={!dept.is_active} className="h-8 w-8 text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Dialog open={isAddOpen || isEditOpen} onOpenChange={(open) => { if (!open) { setIsAddOpen(false); setIsEditOpen(false); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{isEditOpen ? "Edit Department" : "Add New Department"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Department Name <span className="text-red-500">*</span></Label>
              <Input placeholder="e.g. Finance & Accounting" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Department Code <span className="text-red-500">*</span></Label>
              <Input placeholder="e.g. FIN" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} className="uppercase font-mono" />
            </div>
            {isEditOpen && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                <div className="space-y-0.5"><Label>Active Status</Label><p className="text-xs text-slate-500">Inactive departments cannot be selected by users.</p></div>
                <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
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
            <AlertDialogDescription>Are you sure you want to deactivate <strong>{selectedDept?.name}</strong>? New users will not be able to join it.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ═════════════════════════════════════════════════════════════
// JOB LEVELS TAB
// ═════════════════════════════════════════════════════════════
function JobLevelsTab({
  jobLevels,
  setJobLevels,
  onRefresh,
}: {
  jobLevels: JobLevel[];
  setJobLevels: React.Dispatch<React.SetStateAction<JobLevel[]>>;
  onRefresh: () => void;
}) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<JobLevel | null>(null);
  const [formData, setFormData] = useState({ name: "", is_active: true });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasReordered, setHasReordered] = useState(false);

  function openAddModal() { setFormData({ name: "", is_active: true }); setSelectedLevel(null); setIsAddOpen(true); }
  function openEditModal(level: JobLevel) { setFormData({ name: level.name, is_active: level.is_active }); setSelectedLevel(level); setIsEditOpen(true); }
  function openDeleteModal(level: JobLevel) { setSelectedLevel(level); setIsDeleteOpen(true); }

  async function handleAddSubmit() {
    if (!formData.name.trim()) { toast.error("Name is required"); return; }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/job-levels", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name.trim(), level_order: jobLevels.length }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create job level");
      toast.success("Job Level created");
      setIsAddOpen(false);
      onRefresh();
    } catch (err: any) { toast.error(err.message); }
    finally { setIsSubmitting(false); }
  }

  async function handleEditSubmit() {
    if (!selectedLevel || !formData.name.trim()) { toast.error("Name is required"); return; }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/job-levels/${selectedLevel.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name.trim(), is_active: formData.is_active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update job level");
      toast.success("Job Level updated");
      setIsEditOpen(false);
      onRefresh();
    } catch (err: any) { toast.error(err.message); }
    finally { setIsSubmitting(false); }
  }

  async function handleDelete() {
    if (!selectedLevel) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/job-levels/${selectedLevel.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to deactivate job level");
      toast.success("Job Level deactivated");
      setIsDeleteOpen(false);
      onRefresh();
    } catch (err: any) { toast.error(err.message); }
    finally { setIsSubmitting(false); }
  }

  async function saveReorder() {
    setIsSubmitting(true);
    try {
      const updates = jobLevels.map((level, index) => ({ id: level.id, level_order: index }));
      const res = await fetch("/api/admin/job-levels/reorder", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      if (!res.ok) throw new Error("Failed to save order");
      toast.success("Job Level order saved");
      setHasReordered(false);
      onRefresh();
    } catch (err: any) { toast.error(err.message); }
    finally { setIsSubmitting(false); }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Define and reorder the seniority ranking of positions. (Top = Lowest Rank, Bottom = Highest)
        </p>
        <div className="flex gap-3">
          {hasReordered && (
            <Button onClick={saveReorder} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save Hierarchy
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
            <Button onClick={openAddModal} variant="outline" className="mt-4"><Plus className="h-4 w-4 mr-2" /> Create Job Level</Button>
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
            <Reorder.Group axis="y" values={jobLevels} onReorder={(newOrder) => { setJobLevels(newOrder); setHasReordered(true); }} className="space-y-2 relative">
              <div className="absolute left-9 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700 z-0"></div>
              {jobLevels.map((level, index) => (
                <Reorder.Item key={level.id} value={level} className={`relative z-10 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-sm p-4 flex items-center gap-4 transition-colors ${!level.is_active ? "opacity-60 grayscale" : ""}`}>
                  <div className="cursor-grab text-slate-300 dark:text-slate-600 hover:text-slate-500 active:cursor-grabbing w-10 flex justify-center shrink-0"><GripVertical className="h-5 w-5" /></div>
                  <div className="w-16 flex items-center justify-center">
                    <span className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-[10px] font-black font-mono text-slate-500 dark:text-slate-400">{index + 1}</span>
                  </div>
                  <div className="flex-1 font-semibold text-slate-800 dark:text-slate-200">{level.name}</div>
                  <div className="w-20">
                    <Badge variant="outline" className={level.is_active ? "border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30" : "border-slate-200 dark:border-slate-700 text-slate-500 bg-slate-50 dark:bg-slate-800"}>
                      {level.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="w-24 flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(level)} className="h-8 w-8 text-slate-400 hover:text-indigo-600"><Edit2 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => openDeleteModal(level)} disabled={!level.is_active} className="h-8 w-8 text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
            <div className="px-5 mt-4 text-[11px] text-slate-500 font-medium">
              Drag and drop items to restructure your organizational hierarchy. Order goes from Ground (1) to Top Leadership.
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Dialog open={isAddOpen || isEditOpen} onOpenChange={(open) => { if (!open) { setIsAddOpen(false); setIsEditOpen(false); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{isEditOpen ? "Edit Job Level" : "Add New Job Level"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Job Level Name <span className="text-red-500">*</span></Label>
              <Input placeholder="e.g. Senior Officer, Director..." value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            {isEditOpen && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                <div className="space-y-0.5"><Label>Active Status</Label><p className="text-xs text-slate-500">Inactive job levels cannot be assigned to users.</p></div>
                <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
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
            <AlertDialogDescription>Are you sure you want to deactivate <strong>{selectedLevel?.name}</strong>? Users with this level will keep it, but it will be removed from future options.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
