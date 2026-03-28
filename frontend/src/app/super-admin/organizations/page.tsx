"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/loading";
import {
  Building2,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  ExternalLink,
  Mail,
  Phone,
  Globe,
  MapPin,
  User,
} from "lucide-react";
import { toast } from "sonner";
import type { OrganizationApplication, ApplicationStatus } from "@/types/database";

const statusStyles: Record<ApplicationStatus, { bg: string; text: string; dot: string }> = {
  pending: { bg: "bg-amber-50 border-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  approved: { bg: "bg-emerald-50 border-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  rejected: { bg: "bg-red-50 border-red-100", text: "text-red-700", dot: "bg-red-500" },
};

export default function SuperAdminOrganizationsPage() {
  const [applications, setApplications] = useState<OrganizationApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | ApplicationStatus>("all");

  // Approve dialog
  const [approveTarget, setApproveTarget] = useState<OrganizationApplication | null>(null);
  const [adminEmail, setAdminEmail] = useState("");
  const [isApproving, setIsApproving] = useState(false);

  // Reject dialog
  const [rejectTarget, setRejectTarget] = useState<OrganizationApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  // Detail view
  const [detailTarget, setDetailTarget] = useState<OrganizationApplication | null>(null);

  const fetchApplications = useCallback(async () => {
    try {
      const res = await fetch("/api/super/organizations/pending");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setApplications(data);
    } catch {
      toast.error("Failed to load applications");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleApprove = async () => {
    if (!approveTarget) return;
    setIsApproving(true);
    try {
      const res = await fetch(`/api/super/organizations/${approveTarget.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_email: adminEmail || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to approve");
      }
      toast.success(`${approveTarget.name} approved successfully`);
      setApproveTarget(null);
      setAdminEmail("");
      fetchApplications();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Approval failed");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectionReason.trim()) return;
    setIsRejecting(true);
    try {
      const res = await fetch(`/api/super/organizations/${rejectTarget.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejection_reason: rejectionReason }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reject");
      }
      toast.success(`${rejectTarget.name} rejected`);
      setRejectTarget(null);
      setRejectionReason("");
      fetchApplications();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Rejection failed");
    } finally {
      setIsRejecting(false);
    }
  };

  const filtered = applications.filter((app) => {
    const matchesSearch =
      !search ||
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.code.toLowerCase().includes(search.toLowerCase()) ||
      app.applicant_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || app.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Organizations</h1>
        <p className="text-slate-500 font-medium mt-1">
          Review and manage organization registration applications.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(["all", "pending", "approved", "rejected"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`rounded-xl border p-4 text-left transition-all ${
              filterStatus === status
                ? "border-slate-900 bg-slate-50"
                : "border-slate-100 bg-white hover:border-slate-200"
            }`}
          >
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
              {status === "all" ? "Total" : status}
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{statusCounts[status]}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by name, code, or applicant..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11 rounded-xl border-slate-100 bg-slate-50/30 focus:bg-white transition-all shadow-none"
        />
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="h-6 w-6" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400 font-medium">
          <Building2 className="h-10 w-10 mx-auto text-slate-200 mb-3" />
          <p>No applications found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => {
            const style = statusStyles[app.status];
            return (
              <Card
                key={app.id}
                className="shadow-none border border-slate-100 bg-white hover:border-slate-200 transition-all"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Info */}
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                        <Building2 className="h-5 w-5 text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-slate-900 truncate">{app.name}</h3>
                          <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md shrink-0">
                            {app.code}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 font-medium">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {app.applicant_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {app.applicant_email}
                          </span>
                          <span>
                            {new Date(app.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Status + Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${style.bg}`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${style.text}`}>
                          {app.status}
                        </span>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDetailTarget(app)}
                        className="h-8 rounded-lg border-slate-100 text-xs font-bold text-slate-500"
                      >
                        View
                      </Button>

                      {app.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => {
                              setApproveTarget(app);
                              setAdminEmail(app.applicant_email);
                            }}
                            className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-none"
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setRejectTarget(app)}
                            className="h-8 rounded-lg border-red-100 text-red-600 hover:bg-red-50 text-xs font-bold"
                          >
                            <XCircle className="mr-1 h-3 w-3" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detailTarget} onOpenChange={(open) => !open && setDetailTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              {detailTarget?.name}
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Application details and submitted documents.
            </DialogDescription>
          </DialogHeader>
          {detailTarget && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Code</span>
                  <p className="font-semibold text-slate-700 mt-0.5">{detailTarget.code}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Status</span>
                  <p className="font-semibold text-slate-700 mt-0.5 capitalize">{detailTarget.status}</p>
                </div>
                {detailTarget.contact_email && (
                  <div className="flex items-start gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-300 mt-0.5" />
                    <div>
                      <span className="text-xs text-slate-400">Email</span>
                      <p className="font-medium text-slate-700 text-sm">{detailTarget.contact_email}</p>
                    </div>
                  </div>
                )}
                {detailTarget.contact_phone && (
                  <div className="flex items-start gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-300 mt-0.5" />
                    <div>
                      <span className="text-xs text-slate-400">Phone</span>
                      <p className="font-medium text-slate-700 text-sm">{detailTarget.contact_phone}</p>
                    </div>
                  </div>
                )}
                {detailTarget.website && (
                  <div className="flex items-start gap-2">
                    <Globe className="h-3.5 w-3.5 text-slate-300 mt-0.5" />
                    <div>
                      <span className="text-xs text-slate-400">Website</span>
                      <p className="font-medium text-slate-700 text-sm">{detailTarget.website}</p>
                    </div>
                  </div>
                )}
                {detailTarget.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-300 mt-0.5" />
                    <div>
                      <span className="text-xs text-slate-400">Address</span>
                      <p className="font-medium text-slate-700 text-sm">{detailTarget.address}</p>
                    </div>
                  </div>
                )}
              </div>

              {detailTarget.description && (
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Description</span>
                  <p className="text-sm text-slate-600 mt-1">{detailTarget.description}</p>
                </div>
              )}

              <div className="border-t border-slate-100 pt-4">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Applicant</span>
                <div className="grid grid-cols-2 gap-3 mt-2 text-sm">
                  <div>
                    <span className="text-slate-400 text-xs">Name</span>
                    <p className="font-semibold text-slate-700">{detailTarget.applicant_name}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs">Email</span>
                    <p className="font-semibold text-slate-700">{detailTarget.applicant_email}</p>
                  </div>
                  {detailTarget.applicant_position && (
                    <div>
                      <span className="text-slate-400 text-xs">Position</span>
                      <p className="font-semibold text-slate-700">{detailTarget.applicant_position}</p>
                    </div>
                  )}
                  {detailTarget.applicant_phone && (
                    <div>
                      <span className="text-slate-400 text-xs">Phone</span>
                      <p className="font-semibold text-slate-700">{detailTarget.applicant_phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {detailTarget.documents && detailTarget.documents.length > 0 && (
                <div className="border-t border-slate-100 pt-4">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                    Documents ({detailTarget.documents.length})
                  </span>
                  <div className="space-y-2 mt-2">
                    {detailTarget.documents.map((doc, idx) => (
                      <a
                        key={idx}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg border border-slate-100 px-4 py-3 bg-slate-50/30 hover:bg-slate-50 transition-colors"
                      >
                        <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                        <span className="text-sm font-medium text-slate-700 truncate flex-1">
                          {doc.name}
                        </span>
                        <ExternalLink className="h-3.5 w-3.5 text-slate-300" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {detailTarget.rejection_reason && (
                <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-600 font-medium">
                  <strong>Rejection Reason:</strong> {detailTarget.rejection_reason}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={!!approveTarget} onOpenChange={(open) => !open && setApproveTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Approve Application
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Approve <strong>{approveTarget?.name}</strong> and set up the organization admin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-700 font-medium">
              This will create the organization with default departments and job levels.
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Organization Admin Email
              </Label>
              <Input
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@example.gov.np"
                className="h-11 rounded-xl border-slate-100 bg-slate-50/30 focus:bg-white transition-all shadow-none"
              />
              <p className="text-xs text-slate-400 font-medium pl-1">
                Defaults to the applicant&apos;s email. Change to assign a different admin.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-3 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setApproveTarget(null)}
              disabled={isApproving}
              className="h-11 rounded-xl border-slate-100 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isApproving}
              className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-widest shadow-none"
            >
              {isApproving ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve Organization
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Reject Application
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Reject <strong>{rejectTarget?.name}</strong> and provide a reason.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Rejection Reason *
              </Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide the reason for rejection..."
                className="rounded-xl border-slate-100 bg-slate-50/30 focus:bg-white transition-all shadow-none min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-3 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRejectTarget(null);
                setRejectionReason("");
              }}
              disabled={isRejecting}
              className="h-11 rounded-xl border-slate-100 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={isRejecting || !rejectionReason.trim()}
              className="h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-widest shadow-none"
            >
              {isRejecting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject Application
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
