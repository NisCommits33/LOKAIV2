/**
 * dashboard/profile/page.tsx — User Profile Page
 *
 * Shows the user's profile info and provides an option for public users
 * to apply for employee verification. Displays current verification
 * status for users who have already applied.
 *
 * @module app/dashboard/profile
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  OrganizationSelector,
  DepartmentSelector,
  JobLevelSelector,
} from "@/components/selectors";
import { FullPageSpinner } from "@/components/loading";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  User,
  Building2,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
} from "lucide-react";

interface ProfileData {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  verification_status: string;
  is_active: boolean;
  organization_id: string | null;
  department_id: string | null;
  job_level_id: string | null;
  employee_id: string | null;
  rejection_reason: string | null;
  organization?: { id: string; name: string; code: string } | null;
  department?: { id: string; name: string; code: string } | null;
  job_level?: { id: string; name: string; level_order: number } | null;
}

export default function ProfilePage() {
  const { dbUser, isLoading, refreshUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Employee verification form state
  const [showVerifyForm, setShowVerifyForm] = useState(false);
  const [orgId, setOrgId] = useState<string | undefined>();
  const [deptId, setDeptId] = useState<string | undefined>();
  const [jobLevelId, setJobLevelId] = useState<string | undefined>();
  const [employeeId, setEmployeeId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/users/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch {
      // Silent fail
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleApplyVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) {
      toast.error("Please select an organization.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/users/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization_id: orgId,
          department_id: deptId || null,
          job_level_id: jobLevelId || null,
          employee_id: employeeId || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit");
      }

      toast.success("Verification request submitted!");
      await refreshUser();
      await fetchProfile();
      setShowVerifyForm(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to submit verification";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || loadingProfile) return <FullPageSpinner />;

  const canApply =
    profile &&
    (profile.verification_status === "none" ||
      profile.verification_status === "rejected" ||
      !profile.verification_status) &&
    profile.role === "public";

  const isPending = profile?.verification_status === "pending";
  const isVerified = profile?.verification_status === "verified";
  const isRejected = profile?.verification_status === "rejected";
  const isInactive = profile?.is_active === false;

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          My Profile
        </h1>
        <p className="text-slate-500 font-medium mt-1">
          Manage your account and verification status.
        </p>
      </motion.div>

      {/* Profile Info Card */}
      <Card className="shadow-none border border-slate-100 bg-white">
        <CardHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
              <User className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">
                {profile?.full_name || dbUser?.full_name || "User"}
              </CardTitle>
              <CardDescription className="text-sm font-medium text-slate-500">
                {profile?.email || dbUser?.email}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className="capitalize bg-slate-50 text-slate-600 border border-slate-100 font-bold text-[10px] uppercase tracking-widest"
            >
              {(profile?.role || dbUser?.role || "public").replace("_", " ")}
            </Badge>
            {isVerified && (
              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold text-[10px] uppercase tracking-widest">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Verified Employee
              </Badge>
            )}
            {isPending && (
              <Badge className="bg-amber-50 text-amber-700 border border-amber-100 font-bold text-[10px] uppercase tracking-widest">
                <Clock className="h-3 w-3 mr-1" />
                Verification Pending
              </Badge>
            )}
            {isRejected && (
              <Badge className="bg-red-50 text-red-700 border border-red-100 font-bold text-[10px] uppercase tracking-widest">
                <XCircle className="h-3 w-3 mr-1" />
                Verification Rejected
              </Badge>
            )}
            {isInactive && (
              <Badge className="bg-red-50 text-red-700 border border-red-100 font-bold text-[10px] uppercase tracking-widest">
                <XCircle className="h-3 w-3 mr-1" />
                Account Deactivated
              </Badge>
            )}
          </div>

          {/* Show org details if user has them */}
          {profile?.organization && (
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <Building2 className="h-3.5 w-3.5" />
                Organization Details
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-400 font-medium">Organization: </span>
                  <span className="text-slate-700 font-semibold">
                    {profile.organization.name}
                  </span>
                </div>
                {profile.department && (
                  <div>
                    <span className="text-slate-400 font-medium">Department: </span>
                    <span className="text-slate-700 font-semibold">
                      {profile.department.name}
                    </span>
                  </div>
                )}
                {profile.job_level && (
                  <div>
                    <span className="text-slate-400 font-medium">Job Level: </span>
                    <span className="text-slate-700 font-semibold">
                      {profile.job_level.name}
                    </span>
                  </div>
                )}
                {profile.employee_id && (
                  <div>
                    <span className="text-slate-400 font-medium">Employee ID: </span>
                    <span className="text-slate-700 font-semibold">
                      {profile.employee_id}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rejection reason */}
          {isRejected && profile?.rejection_reason && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-600 font-medium">
              <strong>Rejection Reason:</strong> {profile.rejection_reason}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Verification Section */}
      {(canApply || isRejected) && !showVerifyForm && (
        <Card className="shadow-none border border-slate-100 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {isRejected
                      ? "Reapply for Employee Verification"
                      : "Apply for Employee Verification"}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {isRejected
                      ? "Update your details and submit a new verification request."
                      : "Link your account to your government organization for full access."}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowVerifyForm(true)}
                className="h-10 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-none shrink-0"
              >
                {isRejected ? "Reapply" : "Apply Now"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verification Application Form */}
      {showVerifyForm && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="shadow-none border border-emerald-100 bg-white">
            <CardHeader className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900">
                    Employee Verification
                  </CardTitle>
                  <CardDescription className="text-sm font-medium text-slate-500">
                    Select your organization and provide your details.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <form onSubmit={handleApplyVerification} className="space-y-5">
                <OrganizationSelector
                  value={orgId}
                  onValueChange={(val) => {
                    setOrgId(val);
                    setDeptId(undefined);
                    setJobLevelId(undefined);
                  }}
                />

                <DepartmentSelector
                  organizationId={orgId}
                  value={deptId}
                  onValueChange={setDeptId}
                />

                <JobLevelSelector
                  organizationId={orgId}
                  value={jobLevelId}
                  onValueChange={setJobLevelId}
                />

                <div className="space-y-1.5">
                  <Label
                    htmlFor="profile-emp-id"
                    className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1"
                  >
                    Employee ID (Optional)
                  </Label>
                  <Input
                    id="profile-emp-id"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="Enter your employee ID"
                    className="h-11 rounded-xl border-slate-100 bg-slate-50/30 focus:bg-white transition-all shadow-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowVerifyForm(false)}
                    disabled={submitting}
                    className="h-11 px-6 rounded-xl border-slate-100 text-sm font-bold text-slate-500 shadow-none"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting || !orgId}
                    className="flex-1 h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm shadow-none"
                  >
                    {submitting ? (
                      "Submitting..."
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Verification Request
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Pending status info */}
      {isPending && (
        <Card className="shadow-none border border-amber-100 bg-amber-50/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-900">
                  Verification In Progress
                </h3>
                <p className="text-xs text-amber-700 font-medium mt-0.5">
                  Your request is being reviewed by your organization admin. This usually takes 1–2 business days.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
