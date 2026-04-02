/**
 * profile-setup/page.tsx — Profile Setup Wizard
 *
 * A multi-step onboarding form for new users:
 *
 * Step 1: Personal identity (full name) + option to request employee verification
 * Step 2: Organization details (org, department, job level, employee ID)
 *         — only shown if the user opts into employee verification
 *
 * On submission:
 * - Non-employee path: sets profile_completed = true → redirects to /dashboard
 * - Employee path: sets verification_status = "pending" → redirects to /pending-approval
 *
 * Uses React Hook Form + Zod for validation, and the shared cascading
 * selector components for organization/department/job level selection.
 *
 * @module app/profile-setup
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  OrganizationSelector,
  DepartmentSelector,
  JobLevelSelector,
} from "@/components/selectors";
import { Spinner } from "@/components/loading";
import { Container } from "@/components/layout/Container";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Building2,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

/** Zod schema for profile form validation */
const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  organization_id: z.string().optional(),
  department_id: z.string().optional(),
  job_level_id: z.string().optional(),
  employee_id: z.string().optional(),
  wants_verification: z.boolean(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfileSetupPage() {
  const { dbUser, supabaseUser, refreshUser } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name:
        dbUser?.full_name || supabaseUser?.user_metadata?.full_name || "",
      wants_verification: false,
    },
  });

  const organizationId = watch("organization_id");
  const wantsVerification = watch("wants_verification");
  const totalSteps = wantsVerification ? 2 : 1;

  /** Handles final form submission — updates user profile in Supabase */
  const onSubmit = async (data: ProfileFormData) => {
    if (!supabaseUser) return;

    setIsSubmitting(true);
    try {
      const updateData: Record<string, unknown> = {
        full_name: data.full_name,
        profile_completed: true,
      };

      if (data.wants_verification && data.organization_id) {
        updateData.organization_id = data.organization_id;
        updateData.department_id = data.department_id || null;
        updateData.job_level_id = data.job_level_id || null;
        updateData.employee_id = data.employee_id || null;
        updateData.verification_status = "pending";
      }

      const { error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", supabaseUser.id);

      if (error) throw error;

      await refreshUser();
      toast.success("Profile setup complete!");

      if (data.wants_verification) {
        router.push("/pending-approval");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Framer Motion variants for step transition animations */
  const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="py-12 bg-white dark:bg-slate-950 flex-1 min-h-screen">
      <Container>
        <div className="mx-auto max-w-2xl">
          <div className="mb-10 flex items-center justify-end">
            <div className="flex items-center gap-2">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-8 rounded-full transition-all duration-500 ${
                    step >= i + 1 ? "bg-slate-900 dark:bg-slate-100" : "bg-slate-100 dark:bg-slate-800"
                  }`}
                />
              ))}
            </div>
          </div>

          <Card className="shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950">
            <CardHeader className="pt-12 px-10 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm">
                  {step === 1 ? (
                    <User className="h-5 w-5 text-slate-900 dark:text-slate-100" />
                  ) : (
                    <Building2 className="h-5 w-5 text-slate-900 dark:text-slate-100" />
                  )}
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Step {step} of {totalSteps}
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                {step === 1 ? "Personal Identity" : "Organization Details"}
              </CardTitle>
              <CardDescription className="text-sm font-medium pt-1 text-slate-500 dark:text-slate-400">
                {step === 1
                  ? "Tell us about yourself to set up your profile."
                  : "Link your account to your government organization."}
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="p-10">
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step-1"
                      variants={stepVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="space-y-6"
                    >
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="full_name"
                          className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1"
                        >
                          Full Name
                        </Label>
                        <Input
                          id="full_name"
                          {...register("full_name")}
                          placeholder="Enter your full name"
                          className="h-11 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-none"
                        />
                        {errors.full_name && (
                          <p className="text-sm text-red-500 font-medium pl-1">
                            {errors.full_name.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-3 rounded-xl border border-slate-100 dark:border-slate-800 p-5 bg-slate-50/30 dark:bg-slate-900/30">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="wants_verification"
                            {...register("wants_verification")}
                            className="h-4 w-4 rounded border-slate-200"
                          />
                          <Label
                            htmlFor="wants_verification"
                            className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-snug"
                          >
                            I am a government employee and want to verify my
                            identity
                          </Label>
                        </div>
                        <p className="text-xs text-slate-400 font-medium ml-7">
                          You can skip this and use LokAI with public features.
                          Verification can be done later.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step-2"
                      variants={stepVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="space-y-5"
                    >
                      <OrganizationSelector
                        value={organizationId}
                        onValueChange={(val) => {
                          setValue("organization_id", val);
                          setValue("department_id", undefined);
                          setValue("job_level_id", undefined);
                        }}
                      />

                      <DepartmentSelector
                        organizationId={organizationId}
                        value={watch("department_id")}
                        onValueChange={(val) => setValue("department_id", val)}
                      />

                      <JobLevelSelector
                        organizationId={organizationId}
                        value={watch("job_level_id")}
                        onValueChange={(val) => setValue("job_level_id", val)}
                      />

                      <div className="space-y-1.5">
                        <Label
                          htmlFor="employee_id"
                          className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1"
                        >
                          Employee ID (Optional)
                        </Label>
                        <Input
                          id="employee_id"
                          {...register("employee_id")}
                          placeholder="Enter your employee ID"
                          className="h-11 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-none"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>

              <CardFooter className="px-10 pb-12 pt-0 flex gap-4">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    disabled={isSubmitting}
                    className="h-12 px-6 rounded-xl border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all"
                  >
                    Back
                  </Button>
                )}

                {step === 1 && wantsVerification ? (
                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 h-12 bg-slate-900 dark:bg-slate-50 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl font-bold text-xs uppercase tracking-widest shadow-none"
                  >
                    Next Step
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting || (step === 2 && !organizationId)}
                    className="flex-1 h-12 bg-slate-900 dark:bg-slate-50 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl font-bold text-xs uppercase tracking-widest shadow-none"
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        {step === 2 ? "Submitting..." : "Saving..."}
                      </>
                    ) : step === 2 ? (
                      <>
                        Submit for Verification
                        <CheckCircle2 className="ml-2 h-4 w-4" />
                      </>
                    ) : (
                      "Complete Setup"
                    )}
                  </Button>
                )}
              </CardFooter>
            </form>
          </Card>

          <div className="mt-8 flex items-center justify-center gap-3">
            <ShieldCheck className="h-4 w-4 text-slate-600" />
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
              Secured by LokAI Governance Protocol
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}
