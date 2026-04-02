"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import { Clock, CheckCircle2, XCircle, ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import type { OrganizationApplication } from "@/types/database";

export default function ApplicationStatusPage() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <ApplicationStatusContent />
    </Suspense>
  );
}

function ApplicationStatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [application, setApplication] = useState<OrganizationApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplication = async () => {
    if (!id) {
      setError("No application ID provided");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/organizations/applications/${encodeURIComponent(id)}`);
      if (!res.ok) {
        throw new Error("Application not found");
      }
      const data = await res.json();
      setApplication(data);
    } catch {
      setError("Unable to load application status");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (isLoading) return <FullPageSpinner />;

  if (error || !application) {
    return (
      <div className="py-12 bg-white dark:bg-slate-950 flex-1 min-h-screen">
        <Container>
          <div className="mx-auto max-w-lg text-center space-y-4">
            <p className="text-slate-500 dark:text-slate-400 font-medium">{error || "Application not found"}</p>
            <Button
              onClick={() => router.push("/register-organization")}
              variant="outline"
              className="h-12 rounded-xl border-slate-100 text-sm font-bold"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Registration
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  const statusConfig = {
    pending: {
      icon: Clock,
      iconBg: "bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50",
      iconColor: "text-amber-600 dark:text-amber-400",
      badgeBg: "bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50",
      badgeText: "text-amber-700 dark:text-amber-400",
      dotColor: "bg-amber-500",
      title: "Application Under Review",
      description: "Your organization registration is being reviewed by the platform administrator.",
    },
    approved: {
      icon: CheckCircle2,
      iconBg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/50",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      badgeBg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/50",
      badgeText: "text-emerald-700 dark:text-emerald-400",
      dotColor: "bg-emerald-500",
      title: "Application Approved",
      description: "Your organization has been approved and created on the platform.",
    },
    rejected: {
      icon: XCircle,
      iconBg: "bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900/50",
      iconColor: "text-red-500 dark:text-red-400",
      badgeBg: "bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900/50",
      badgeText: "text-red-700 dark:text-red-400",
      dotColor: "bg-red-500",
      title: "Application Rejected",
      description: "Unfortunately, your organization registration was not approved.",
    },
  };

  const config = statusConfig[application.status];
  const StatusIcon = config.icon;

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
              <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border ${config.iconBg} mb-6`}>
                <StatusIcon className={`h-8 w-8 ${config.iconColor}`} />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                {config.title}
              </CardTitle>
              <CardDescription className="text-sm font-medium pt-1 text-slate-500 dark:text-slate-400">
                {config.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-10 space-y-6">
              {/* Status Badge */}
              <div className="flex justify-center">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${config.badgeBg}`}>
                  <div className={`h-2 w-2 rounded-full ${config.dotColor} ${application.status === "pending" ? "animate-pulse" : ""}`} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${config.badgeText}`}>
                    {application.status}
                  </span>
                </div>
              </div>

              {/* Application Details */}
              <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 p-5 space-y-3">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Application Details
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-400 text-xs">Organization</span>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">{application.name}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs">Code</span>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">{application.code}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs">Applicant</span>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">{application.applicant_name}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs">Submitted</span>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      {new Date(application.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rejection Reason */}
              {application.status === "rejected" && application.rejection_reason && (
                <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 p-4 text-sm text-red-600 dark:text-red-400 font-medium">
                  <strong>Reason:</strong> {application.rejection_reason}
                </div>
              )}

              {/* Pending Info */}
              {application.status === "pending" && (
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium text-center leading-relaxed">
                  This usually takes 1–2 business days. You will receive a notification once a decision is made.
                </p>
              )}

              {/* Approved Info */}
              {application.status === "approved" && (
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium text-center leading-relaxed">
                  Your organization is now active. Sign in with your applicant email to access the admin dashboard.
                </p>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3 pt-2">
                <Button
                  onClick={() => {
                    setIsLoading(true);
                    fetchApplication().finally(() => setIsLoading(false));
                  }}
                  variant="outline"
                  className="w-full h-12 rounded-xl border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all shadow-none"
                >
                  Refresh Status
                </Button>

                {application.status === "approved" && (
                  <Button
                    onClick={() => router.push("/login")}
                    className="w-full h-12 bg-slate-900 dark:bg-slate-50 hover:bg-black dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl font-bold text-xs uppercase tracking-widest shadow-none"
                  >
                    Sign In to Dashboard
                  </Button>
                )}

                {application.status === "rejected" && (
                  <Button
                    onClick={() => router.push("/register-organization")}
                    className="w-full h-12 bg-slate-900 dark:bg-slate-50 hover:bg-black dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl font-bold text-xs uppercase tracking-widest shadow-none"
                  >
                    Submit New Application
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-center gap-4 pt-4 text-xs text-slate-400 font-medium">
                <button
                  onClick={() => router.push("/")}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Home
                </button>
                <span>·</span>
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
            <ShieldCheck className="h-4 w-4 text-slate-600" />
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
              Secured by LokAI Governance Protocol
            </p>
          </div>
        </motion.div>
      </Container>
    </div>
  );
}
