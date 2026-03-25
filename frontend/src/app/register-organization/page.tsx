"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/loading";
import { Container } from "@/components/layout/Container";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  User,
  FileUp,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Upload,
  X,
  FileText,
  Lock,
} from "lucide-react";

const orgDetailsSchema = z.object({
  name: z.string().min(3, "Organization name must be at least 3 characters"),
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(10, "Code must be at most 10 characters")
    .regex(/^[A-Z0-9_]+$/, "Code must be uppercase letters, numbers, or underscores"),
  description: z.string().optional(),
  address: z.string().optional(),
  contact_email: z.string().email("Enter a valid email"),
  contact_phone: z.string().optional(),
  website: z.string().url("Enter a valid URL").optional().or(z.literal("")),
});

const applicantSchema = z.object({
  applicant_name: z.string().min(2, "Name must be at least 2 characters"),
  applicant_email: z.string().email("Enter a valid email"),
  applicant_position: z.string().optional(),
  applicant_phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirm_password: z.string().min(1, "Please confirm your password"),
});

const fullSchema = orgDetailsSchema.merge(applicantSchema).refine(
  (data) => data.password === data.confirm_password,
  { message: "Passwords don't match", path: ["confirm_password"] }
);
type FormData = z.infer<typeof fullSchema>;

interface UploadedDoc {
  name: string;
  url: string;
  type: string;
}

interface StagedFile {
  file: File;
  name: string;
}

export default function OrgRegistrationPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const totalSteps = 3;

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(fullSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      address: "",
      contact_email: "",
      contact_phone: "",
      website: "",
      applicant_name: "",
      applicant_email: "",
      applicant_position: "",
      applicant_phone: "",
      password: "",
      confirm_password: "",
    },
  });

  const handleNextStep = async () => {
    if (step === 1) {
      const valid = await trigger([
        "name",
        "code",
        "description",
        "address",
        "contact_email",
        "contact_phone",
        "website",
      ]);
      if (valid) setStep(2);
    } else if (step === 2) {
      const valid = await trigger([
        "applicant_name",
        "applicant_email",
        "applicant_position",
        "applicant_phone",
        "password",
        "confirm_password",
      ]);
      if (valid) setStep(3);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10MB limit`);
        continue;
      }
      setStagedFiles((prev) => [...prev, { file, name: file.name }]);
    }
    e.target.value = "";
  };

  const removeDocument = (index: number) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // 1. Upload staged documents first (as anon — no auth needed)
      const uploadedDocs: UploadedDoc[] = [];
      for (const staged of stagedFiles) {
        const ext = staged.name.split(".").pop();
        const path = `applications/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("org-applications")
          .upload(path, staged.file);

        if (uploadError) {
          toast.error(`Failed to upload ${staged.name}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("org-applications")
          .getPublicUrl(path);

        uploadedDocs.push({
          name: staged.name,
          url: urlData.publicUrl,
          type: staged.file.type,
        });
      }

      // 2. Submit the application WITH password (server creates auth account)
      const { confirm_password: _cpw, ...formFields } = data;
      const res = await fetch("/api/organizations/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formFields, documents: uploadedDocs }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to submit application");
      }

      if (result.warning) {
        console.warn("Registration warning:", result.warning);
        toast.error(result.warning);
        setIsSubmitting(false);
        return;
      }

      toast.success("Application submitted successfully!");
      router.push(`/register-organization/status?id=${result.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit application"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  const stepIcons = [Building2, User, FileUp];
  const stepTitles = ["Organization Details", "Applicant Details", "Documents & Submit"];
  const stepDescriptions = [
    "Tell us about your government organization.",
    "Your contact information as the applicant.",
    "Upload supporting documents and submit your application.",
  ];

  const StepIcon = stepIcons[step - 1];

  return (
    <div className="py-12 bg-white flex-1 min-h-screen">
      <Container>
        <div className="mx-auto max-w-2xl">
          {/* Progress */}
          <div className="mb-10 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Register Organization</h2>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-8 rounded-full transition-all duration-500 ${
                    step >= i + 1 ? "bg-slate-900" : "bg-slate-100"
                  }`}
                />
              ))}
            </div>
          </div>

          <Card className="shadow-none border border-slate-100 overflow-hidden bg-white">
            <CardHeader className="pt-12 px-10 bg-slate-50/50 border-b border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                  <StepIcon className="h-5 w-5 text-slate-900" />
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Step {step} of {totalSteps}
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight">
                {stepTitles[step - 1]}
              </CardTitle>
              <CardDescription className="text-sm font-medium pt-1 text-slate-500">
                {stepDescriptions[step - 1]}
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="p-10">
                <AnimatePresence mode="wait">
                  {/* Step 1: Organization Details */}
                  {step === 1 && (
                    <motion.div
                      key="step-1"
                      variants={stepVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="space-y-5"
                    >
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                          Organization Name *
                        </Label>
                        <Input
                          {...register("name")}
                          placeholder="e.g., Ministry of Education"
                          className="h-11 rounded-xl border-slate-100 bg-slate-50/30 focus:bg-white transition-all shadow-none"
                        />
                        {errors.name && (
                          <p className="text-sm text-red-500 font-medium pl-1">{errors.name.message}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                            Organization Code *
                          </Label>
                          <Input
                            {...register("code")}
                            placeholder="e.g., MOE"
                            className="h-11 rounded-xl border-slate-100 bg-slate-50/30 focus:bg-white transition-all shadow-none uppercase"
                          />
                          {errors.code && (
                            <p className="text-sm text-red-500 font-medium pl-1">{errors.code.message}</p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                            Contact Email *
                          </Label>
                          <Input
                            {...register("contact_email")}
                            type="email"
                            placeholder="org@example.gov.np"
                            className="h-11 rounded-xl border-slate-100 bg-slate-50/30 focus:bg-white transition-all shadow-none"
                          />
                          {errors.contact_email && (
                            <p className="text-sm text-red-500 font-medium pl-1">{errors.contact_email.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                          Description
                        </Label>
                        <Textarea
                          {...register("description")}
                          placeholder="Brief description of the organization"
                          className="rounded-xl border-slate-100 bg-slate-50/30 focus:bg-white transition-all shadow-none min-h-[80px]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                          Address
                        </Label>
                        <Input
                          {...register("address")}
                          placeholder="Organization address"
                          className="h-11 rounded-xl border-slate-100 bg-slate-50/30 focus:bg-white transition-all shadow-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                            Phone
                          </Label>
                          <Input
                            {...register("contact_phone")}
                            placeholder="+977-01-XXXXXXX"
                            className="h-11 rounded-xl border-slate-100 bg-slate-50/30 focus:bg-white transition-all shadow-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                            Website
                          </Label>
                          <Input
                            {...register("website")}
                            placeholder="https://example.gov.np"
                            className="h-11 rounded-xl border-slate-100 bg-slate-50/30 focus:bg-white transition-all shadow-none"
                          />
                          {errors.website && (
                            <p className="text-sm text-red-500 font-medium pl-1">{errors.website.message}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Applicant Details */}
                  {step === 2 && (
                    <motion.div
                      key="step-2"
                      variants={stepVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="space-y-5"
                    >
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                          Your Full Name *
                        </Label>
                        <Input
                          {...register("applicant_name")}
                          placeholder="Enter your full name"
                          className="h-11 rounded-xl border-slate-100 bg-slate-50/30 focus:bg-white transition-all shadow-none"
                        />
                        {errors.applicant_name && (
                          <p className="text-sm text-red-500 font-medium pl-1">{errors.applicant_name.message}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                          Your Email *
                        </Label>
                        <Input
                          {...register("applicant_email")}
                          type="email"
                          placeholder="your@email.com"
                          className="h-11 rounded-xl border-slate-100 bg-slate-50/30 focus:bg-white transition-all shadow-none"
                        />
                        {errors.applicant_email && (
                          <p className="text-sm text-red-500 font-medium pl-1">{errors.applicant_email.message}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                            Position / Title
                          </Label>
                          <Input
                            {...register("applicant_position")}
                            placeholder="e.g., Director"
                            className="h-11 rounded-xl border-slate-100 bg-slate-50/30 focus:bg-white transition-all shadow-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                            Phone Number
                          </Label>
                          <Input
                            {...register("applicant_phone")}
                            placeholder="+977-98XXXXXXXX"
                            className="h-11 rounded-xl border-slate-100 bg-slate-50/30 focus:bg-white transition-all shadow-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 pb-1">
                        <Lock className="h-3.5 w-3.5 text-slate-400" />
                        <p className="text-xs font-semibold text-slate-400">
                          Create login credentials — you&apos;ll use this email and password to sign in.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                            Password *
                          </Label>
                          <Input
                            {...register("password")}
                            type="password"
                            placeholder="Min 6 characters"
                            className="h-11 rounded-xl border-slate-100 bg-slate-50/30 focus:bg-white transition-all shadow-none"
                          />
                          {errors.password && (
                            <p className="text-sm text-red-500 font-medium pl-1">{errors.password.message}</p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                            Confirm Password *
                          </Label>
                          <Input
                            {...register("confirm_password")}
                            type="password"
                            placeholder="Re-enter password"
                            className="h-11 rounded-xl border-slate-100 bg-slate-50/30 focus:bg-white transition-all shadow-none"
                          />
                          {errors.confirm_password && (
                            <p className="text-sm text-red-500 font-medium pl-1">{errors.confirm_password.message}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Document Upload & Submit */}
                  {step === 3 && (
                    <motion.div
                      key="step-3"
                      variants={stepVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="space-y-5"
                    >
                      <div className="space-y-3">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                          Supporting Documents
                        </Label>
                        <p className="text-xs text-slate-400 font-medium pl-1">
                          Upload registration certificate, official letter, or other supporting documents (PDF, max 10MB each).
                        </p>

                        <label className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/30 p-8 cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition-all">
                          <Upload className="h-8 w-8 text-slate-300" />
                          <div className="text-center">
                            <span className="text-sm font-semibold text-slate-600">
                              Click to add files
                            </span>
                            <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG up to 10MB</p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            multiple
                            onChange={handleFileUpload}
                          />
                        </label>

                        {stagedFiles.length > 0 && (
                          <div className="space-y-2 mt-3">
                            {stagedFiles.map((staged, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-3 rounded-lg border border-slate-100 px-4 py-3 bg-white"
                              >
                                <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                                <span className="text-sm font-medium text-slate-700 truncate flex-1">
                                  {staged.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeDocument(idx)}
                                  className="text-slate-300 hover:text-red-500 transition-colors"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Application Summary */}
                      <div className="rounded-xl border border-slate-100 bg-slate-50/30 p-5 space-y-3">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                          Application Summary
                        </p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-slate-400 text-xs">Organization</span>
                            <p className="font-semibold text-slate-700">{watch("name") || "—"}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 text-xs">Code</span>
                            <p className="font-semibold text-slate-700">{watch("code") || "—"}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 text-xs">Applicant</span>
                            <p className="font-semibold text-slate-700">{watch("applicant_name") || "—"}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 text-xs">Documents</span>
                            <p className="font-semibold text-slate-700">{stagedFiles.length} file(s)</p>
                          </div>
                        </div>
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
                    onClick={() => setStep(step - 1)}
                    disabled={isSubmitting}
                    className="h-12 px-6 rounded-xl border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                )}

                {step < totalSteps ? (
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="flex-1 h-12 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-none"
                  >
                    Next Step
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 h-12 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-none"
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Application
                        <CheckCircle2 className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </CardFooter>
            </form>
          </Card>

          <div className="mt-8 flex items-center justify-center gap-3">
            <ShieldCheck className="h-4 w-4 text-slate-300" />
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
              Secured by LokAI Governance Protocol
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}
