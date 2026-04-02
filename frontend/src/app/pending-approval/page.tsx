/**
 * pending-approval/page.tsx — Verification Status Page
 *
 * Displayed to users who have submitted an employee verification request.
 * Shows different content based on verification status:
 *
 * - "pending"  → Waiting message with status check button and public access CTA
 * - "rejected" → Rejection reason with options to reapply or continue as public user
 *
 * Users can check their status in real-time via the refreshUser action.
 *
 * @module app/pending-approval
 */

"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FullPageSpinner } from "@/components/loading";
import { Container } from "@/components/layout/Container";
import { Clock, LogOut, Mail, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function PendingApprovalPage() {
  const { dbUser, signOut, isLoading, refreshUser } = useAuth();
  const router = useRouter();

  if (isLoading) return <FullPageSpinner />;

  /** Signs the user out and redirects to login */
  const handleLogout = async () => {
    await signOut();
    window.location.href = "/login";
  };

  /** Refreshes user data and redirects to dashboard if verified */
  const handleCheckStatus = async () => {
    await refreshUser();
    if (dbUser?.verification_status === "verified") {
      router.push("/dashboard");
    }
  };

  // If rejected, show rejection info
  if (dbUser?.verification_status === "rejected") {
    return (
      <div className="py-12 bg-white dark:bg-slate-950 flex-1 min-h-screen">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-lg"
          >
            <Card className="shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950">
              <CardHeader className="text-center pt-12 px-10 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 mb-6">
                  <span className="text-2xl text-red-500">✕</span>
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                  Verification Rejected
                </CardTitle>
                <CardDescription className="text-sm font-medium pt-1 text-slate-500">
                  Your employee verification request was not approved.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-6">
                {dbUser.rejection_reason && (
                  <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 p-4 text-sm text-red-600 dark:text-red-400 font-medium">
                    <strong>Reason:</strong> {dbUser.rejection_reason}
                  </div>
                )}
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium text-center">
                  You can update your information and reapply, or continue using
                  LokAI with public features.
                </p>
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => router.push("/profile-setup")}
                    className="w-full h-12 bg-slate-900 dark:bg-slate-50 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl font-bold text-xs uppercase tracking-widest shadow-none"
                  >
                    Update & Reapply
                  </Button>
                  <Button
                    onClick={() => router.push("/dashboard")}
                    variant="outline"
                    className="w-full h-12 rounded-xl border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all"
                  >
                    Continue as Public User
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-12 bg-white dark:bg-slate-950 flex-1 min-h-screen">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-lg"
        >
          <Card className="shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950">
            <CardHeader className="text-center pt-12 px-10 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 mb-6">
                <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                {dbUser?.role === "org_admin" ? "Organization Under Review" : "Verification Pending"}
              </CardTitle>
              <CardDescription className="text-sm font-medium pt-1 text-slate-500">
                {dbUser?.role === "org_admin" 
                  ? "Your organization application is being reviewed by the platform administrators."
                  : "Your employee verification request is being reviewed by your organization admin."}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-6">
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50">
                  <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">
                    Pending Review
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium text-center leading-relaxed">
                {dbUser?.role === "org_admin"
                  ? "We are verifying your organization registration details. This typically takes 24–48 hours."
                  : "This usually takes 1–2 business days. You'll be able to access organization content once approved."}
              </p>

              <div className="flex flex-col gap-3 pt-2">
                <Button
                  onClick={handleCheckStatus}
                  variant="outline"
                  className="w-full h-12 rounded-xl border-slate-100 text-sm font-bold text-slate-600 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all shadow-none"
                >
                  Check Status
                </Button>
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="w-full h-12 bg-slate-900 dark:bg-slate-50 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl font-bold text-xs uppercase tracking-widest shadow-none"
                >
                  Continue with Public Features
                </Button>
              </div>

              <div className="flex items-center justify-center gap-4 pt-4 text-xs text-slate-400 font-medium">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  <LogOut className="h-3 w-3" />
                  Sign Out
                </button>
                <span>•</span>
                <a
                  href="mailto:support@lokai.com"
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  <Mail className="h-3 w-3" />
                  Contact Support
                </a>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 flex items-center justify-center gap-3">
            <ShieldCheck className="h-4 w-4 text-slate-300" />
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
              Secured by LokAI Governance Protocol
            </p>
          </div>
        </motion.div>
      </Container>
    </div>
  );
}
