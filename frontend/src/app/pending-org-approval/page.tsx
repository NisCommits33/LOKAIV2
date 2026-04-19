/**
 * pending-org-approval/page.tsx — Organization Review Pending Page
 *
 * Displayed to users who have registered an organization and are waiting
 * for Super Admin approval. Prevents them from being treated as regular 
 * public users until their admin rights are provisioned.
 *
 * @module app/pending-org-approval
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
import { Clock, LogOut, Mail, ShieldCheck, Building2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function PendingOrgApprovalPage() {
  const { signOut, isLoading, refreshUser } = useAuth();
  const router = useRouter();
  const [application, setApplication] = useState<{status: string, rejection_reason: string | null} | null>(null);
  const [fetching, setFetching] = useState(true);

  // Fetch application status on load
  useEffect(() => {
    const fetchApp = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("organization_applications")
        .select("status, rejection_reason")
        .eq("applicant_email", user.email)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      setApplication(data);
      setFetching(false);
    };
    fetchApp();
  }, []);

  if (isLoading || fetching) return <FullPageSpinner />;

  const isRejected = application?.status === "rejected";

  /** Signs the user out and redirects to login */
  const handleLogout = async () => {
    await signOut();
    window.location.href = "/login";
  };

  /** Refreshes user data and redirects to admin portal if approved */
  const handleCheckStatus = async () => {
    const refreshPromise = refreshUser();
    toast.promise(refreshPromise, {
      loading: "Checking your application status...",
      success: (data: any) => {
        if (data?.role === "org_admin") {
          router.push("/admin");
          return "Your organization has been approved! Redirecting...";
        }
        return "Your application is still under review.";
      },
      error: "Failed to check status. Please try again.",
    });
    await refreshPromise;
  };

  return (
    <div className="py-12 bg-white dark:bg-slate-950 flex-1 min-h-screen flex items-center">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-lg"
        >
          <Card className="shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950">
            <CardHeader className={`text-center pt-12 px-10 ${isRejected ? 'bg-red-50/50 dark:bg-red-950/20' : 'bg-slate-50/50 dark:bg-slate-900/50'} border-b border-slate-100 dark:border-slate-800`}>
              <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${isRejected ? 'bg-red-100 dark:bg-red-900/30' : 'bg-indigo-50 dark:bg-indigo-950/30'} border ${isRejected ? 'border-red-200 dark:border-red-800/50' : 'border-indigo-100 dark:border-indigo-900/50'} mb-6`}>
                {isRejected ? <Clock className="h-8 w-8 text-red-600 dark:text-red-400" /> : <Building2 className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />}
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                {isRejected ? "Application Rejected" : "Organization Under Review"}
              </CardTitle>
              <CardDescription className="text-sm font-medium pt-1 text-slate-500">
                {isRejected 
                  ? "Your organization registration request has been declined." 
                  : "Your application to register a new organization on LokAI is being reviewed."}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-6">
              <div className="flex justify-center">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${isRejected ? 'bg-red-50 dark:bg-red-950/30 border-red-100' : 'bg-amber-50 dark:bg-amber-950/30 border-amber-100'} border`}>
                  <div className={`h-2 w-2 rounded-full ${isRejected ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isRejected ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
                    {isRejected ? "Application Rejected" : "Verification In Progress"}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {isRejected ? (
                   <div className="rounded-xl border border-red-100 dark:border-red-900/50 p-5 bg-red-50/30 dark:bg-red-900/10">
                    <h4 className="text-[10px] font-black text-red-400 uppercase tracking-[0.1em] mb-2">Reason for Rejection</h4>
                    <p className="text-sm font-bold text-red-700 dark:text-red-400">
                      {application?.rejection_reason || "No specific reason provided. Please contact support."}
                    </p>
                    <p className="text-[11px] text-red-400 mt-4 leading-relaxed font-medium">
                      If you believe this is an error or wish to appeal, please contact our support team with your application ID.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium text-center leading-relaxed">
                      Platform administrators are currently verifying your organization's registration details. This typically takes <strong>24–48 hours</strong>.
                    </p>
                    
                    <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-4 bg-slate-50/30 dark:bg-slate-900/30">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-3">Next Steps</h4>
                      <ul className="space-y-3">
                        {[
                          "Identity and credentials verification",
                          "Organization record creation",
                          "Admin portal provisioning"
                        ].map((step, i) => (
                          <li key={i} className="flex items-start gap-3 text-xs font-medium text-slate-600 dark:text-slate-400">
                            <CheckCircle2 className="h-3.5 w-3.5 text-slate-300 dark:text-slate-700 mt-0.5" />
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <Button
                  onClick={handleCheckStatus}
                  className="w-full h-12 bg-slate-900 dark:bg-slate-50 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl font-bold text-xs uppercase tracking-widest shadow-none transition-all"
                >
                  Check Status
                </Button>
                <div className="flex gap-3">
                    <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="flex-1 h-12 rounded-xl border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all"
                    >
                    <LogOut className="mr-2 h-3 w-3" />
                    Sign Out
                    </Button>
                    <Button
                    variant="outline"
                    className="flex-1 h-12 rounded-xl border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all"
                    asChild
                    >
                    <a href="mailto:support@lokai.com">
                        <Mail className="mr-2 h-3 w-3" />
                        Support
                    </a>
                    </Button>
                </div>
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
