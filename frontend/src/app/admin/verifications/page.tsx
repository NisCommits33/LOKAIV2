/**
 * admin/verifications/page.tsx — Employee Verification Management
 *
 * Org admin page for reviewing employee verification requests.
 * Features:
 * - Table of pending verification requests with user details
 * - Search by name or employee ID
 * - Approve with single-click confirmation
 * - Reject with predefined reasons or custom reason
 * - Real-time list refresh after actions
 *
 * @module app/admin/verifications
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/loading";
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  ShieldCheck,
  Building2,
  Briefcase,
  IdCard,
  Mail,
} from "lucide-react";
import { toast } from "sonner";

/** Predefined rejection reasons for common scenarios */
const REJECTION_REASONS = [
  "Invalid Employee ID",
  "Wrong Department",
  "Not a recognized employee",
  "Duplicate account",
  "Other",
] as const;

/** Shape of a pending verification user from the API */
interface PendingUser {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  employee_id: string | null;
  verification_status: string;
  created_at: string;
  department: { id: string; name: string; code: string } | null;
  job_level: { id: string; name: string; level_order: number } | null;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminVerificationsPage() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Approve dialog
  const [approveTarget, setApproveTarget] = useState<PendingUser | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  // Reject dialog
  const [rejectTarget, setRejectTarget] = useState<PendingUser | null>(null);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const fetchPendingUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/verifications/pending");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setPendingUsers(data);
    } catch {
      toast.error("Failed to load pending verifications");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingUsers();
  }, [fetchPendingUsers]);

  // Filter by search term
  const filtered = pendingUsers.filter((user) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.employee_id?.toLowerCase().includes(q) ||
      user.department?.name.toLowerCase().includes(q)
    );
  });

  const handleApprove = async () => {
    if (!approveTarget) return;
    setIsApproving(true);
    try {
      const res = await fetch(
        `/api/admin/verifications/${approveTarget.id}/approve`,
        { method: "POST" }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to approve");
      }
      toast.success(`${approveTarget.full_name || "User"} approved successfully`);
      setApproveTarget(null);
      fetchPendingUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    const reason = selectedReason === "Other" ? customReason : selectedReason;
    if (!reason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    setIsRejecting(true);
    try {
      const res = await fetch(
        `/api/admin/verifications/${rejectTarget.id}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reject");
      }
      toast.success(`${rejectTarget.full_name || "User"} verification rejected`);
      setRejectTarget(null);
      setSelectedReason("");
      setCustomReason("");
      fetchPendingUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reject");
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Employee Verifications
        </h1>
        <p className="text-slate-500 font-medium mt-1">
          Review and approve employee verification requests for your organization.
        </p>
      </div>

      {/* Stats + Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-100">
          <Clock className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-bold text-amber-700">
            {pendingUsers.length} pending
          </span>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name, email, or employee ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-xl border-slate-100 bg-slate-50/50 text-sm shadow-none"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-20">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filtered.length === 0 && (
        <Card className="shadow-none border border-slate-100 bg-white">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6">
              <ShieldCheck className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {search ? "No matching requests" : "All caught up!"}
            </h3>
            <p className="text-sm text-slate-500 font-medium">
              {search
                ? "Try a different search term."
                : "No pending verification requests right now."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pending Users List */}
      {!isLoading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((user) => (
            <Card
              key={user.id}
              className="shadow-none border border-slate-100 bg-white hover:border-slate-200 transition-colors"
            >
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  {/* Avatar + Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Avatar className="h-11 w-11 shrink-0">
                      <AvatarImage src={user.avatar_url ?? undefined} />
                      <AvatarFallback className="text-xs font-bold bg-slate-100 text-slate-600">
                        {getInitials(user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {user.full_name || "Unnamed User"}
                        </h3>
                        <Badge
                          variant="outline"
                          className="shrink-0 text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 border-amber-100"
                        >
                          Pending
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </span>
                        {user.employee_id && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <IdCard className="h-3 w-3" />
                            {user.employee_id}
                          </span>
                        )}
                        {user.department && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Building2 className="h-3 w-3" />
                            {user.department.name}
                          </span>
                        )}
                        {user.job_level && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Briefcase className="h-3 w-3" />
                            {user.job_level.name}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Applied {formatDate(user.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 sm:ml-auto">
                    <Button
                      onClick={() => setApproveTarget(user)}
                      size="sm"
                      className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-none"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => setRejectTarget(user)}
                      size="sm"
                      variant="outline"
                      className="h-9 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg text-xs font-bold shadow-none"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1.5" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approve Confirmation Dialog */}
      <Dialog
        open={!!approveTarget}
        onOpenChange={(open) => !open && setApproveTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Approve Verification
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Confirm that{" "}
              <span className="font-semibold text-slate-700">
                {approveTarget?.full_name || "this user"}
              </span>{" "}
              is a verified employee of your organization.
            </DialogDescription>
          </DialogHeader>

          {approveTarget && (
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="text-slate-600">{approveTarget.email}</span>
              </div>
              {approveTarget.employee_id && (
                <div className="flex items-center gap-2 text-sm">
                  <IdCard className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600">
                    Employee ID: {approveTarget.employee_id}
                  </span>
                </div>
              )}
              {approveTarget.department && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600">
                    {approveTarget.department.name}
                  </span>
                </div>
              )}
              {approveTarget.job_level && (
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600">
                    {approveTarget.job_level.name}
                  </span>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setApproveTarget(null)}
              className="rounded-xl shadow-none"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isApproving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-none"
            >
              {isApproving && <Spinner className="h-4 w-4 mr-2" />}
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={!!rejectTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null);
            setSelectedReason("");
            setCustomReason("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Reject Verification
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Provide a reason for rejecting{" "}
              <span className="font-semibold text-slate-700">
                {rejectTarget?.full_name || "this user"}
              </span>
              &apos;s verification request.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                Rejection Reason
              </Label>
              <Select
                value={selectedReason}
                onValueChange={setSelectedReason}
              >
                <SelectTrigger className="rounded-xl border-slate-100 h-11 shadow-none">
                  <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent>
                  {REJECTION_REASONS.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedReason === "Other" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Custom Reason
                </Label>
                <Textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Explain why this verification is being rejected..."
                  className="rounded-xl border-slate-100 min-h-[100px] shadow-none resize-none"
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRejectTarget(null);
                setSelectedReason("");
                setCustomReason("");
              }}
              className="rounded-xl shadow-none"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={
                isRejecting ||
                !selectedReason ||
                (selectedReason === "Other" && !customReason.trim())
              }
              variant="destructive"
              className="rounded-xl shadow-none"
            >
              {isRejecting && <Spinner className="h-4 w-4 mr-2" />}
              Reject Verification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
