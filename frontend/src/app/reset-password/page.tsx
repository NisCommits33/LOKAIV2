/**
 * reset-password/page.tsx — New Password Page
 *
 * Allows users to set a new password after clicking a recovery link.
 * Uses Supabase's auth.updateUser() method.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Container } from "@/components/layout/Container";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle2, RefreshCw, ArrowRight } from "lucide-react";

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    if (!hasNumber || !hasSpecial) {
      toast.error("Password must include at least one number and one special character.");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccess(true);
      toast.success("Password updated successfully!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update password";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center py-12 bg-white dark:bg-slate-950">
        <Container>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-auto max-w-lg text-center"
          >
            <div className="mb-8 flex justify-center">
              <div className="h-20 w-20 rounded-3xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-10 w-10" />
              </div>
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight mb-4">
              Password Updated
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed max-w-sm mx-auto">
              Your password has been reset successfully. You can now use your new password to sign in.
            </p>
            <Button
              className="w-full h-14 bg-slate-900 dark:bg-slate-50 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 text-base font-black rounded-2xl shadow-xl shadow-slate-900/10 dark:shadow-none"
              onClick={() => router.push("/login")}
            >
              Back to Login
            </Button>
          </motion.div>
        </Container>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center py-12 bg-white dark:bg-slate-950">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-lg"
        >
          <Card className="shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950">
            <CardHeader className="text-center pt-10 px-10">
              <div className="mx-auto h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-slate-900 dark:text-slate-100" />
              </div>
              <CardTitle className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                New Password
              </CardTitle>
              <CardDescription className="text-base pt-3 font-medium text-slate-500 dark:text-slate-400">
                Please enter a new secure password for your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-10 pb-12">
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1"
                  >
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPw ? "text" : "password"}
                      placeholder="At least 8 characters"
                      className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-none pr-11"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1"
                  >
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Repeat new password"
                      className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-none pr-11"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-sm font-bold rounded-xl bg-slate-900 dark:bg-slate-50 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 shadow-none mt-2"
                  disabled={loading}
                >
                  {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </div>
  );
}
