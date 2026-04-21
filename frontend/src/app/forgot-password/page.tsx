/**
 * forgot-password/page.tsx — OTP Password Recovery Flow
 * 
 * A premium 4-step wizard for password recovery:
 * 1. Email Submission (resetPasswordForEmail)
 * 2. 4-Digit OTP Verification (verifyOtp)
 * 3. New Password Entry (updateUser)
 * 4. Success Completion
 */

"use client";

import { useState, useRef, useEffect } from "react";
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
import { BackButton } from "@/components/ui/back-button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowRight, Lock, Eye, EyeOff, CheckCircle2, ShieldCheck, RefreshCw } from "lucide-react";

type Step = 'email' | 'otp' | 'password' | 'success';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", "", "", ""]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const supabase = createClient();
  const router = useRouter();

  // Cooldown effect
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Handle Step 1: Submit Email
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
      });
      if (error) throw error;
      setStep('otp');
      setResendCooldown(60);
      toast.success("Recovery code sent to your email!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send recovery code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
      });
      if (error) throw error;
      setResendCooldown(60);
      toast.success("A new code has been sent!");
    } catch (err: any) {
      toast.error(err.message || "Failed to resend code.");
    } finally {
      setResendLoading(false);
    }
  };

  // Handle Step 2: Verify OTP
  const handleOtpSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const token = otp.join("");
    if (token.length < 8) {
      toast.error("Please enter the complete 8-digit code.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'recovery',
      });
      if (error) throw error;
      setStep('password');
      toast.success("Code verified successfully!");
    } catch (err: any) {
      toast.error(err.message || "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 3: Update Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    const hasNumber = /\d/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    if (!hasNumber || !hasSpecial) {
      toast.error("Password must include at least one number and one special character.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      setStep('success');
      toast.success("Password updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  // OTP Input Logic
  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus move forward
    if (value && index < 7) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const data = e.clipboardData.getData("text").slice(0, 8);
    if (!/^\d+$/.test(data)) return;

    const newOtp = [...otp];
    data.split("").forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);
    otpRefs[Math.min(data.length, 7)].current?.focus();
  };

  // UI Variants for Framer Motion
  const variants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center py-12 bg-white dark:bg-slate-950">
      <Container>
        <div className="mx-auto max-w-lg">
          <div className="mb-6 flex items-center justify-between">
            {step !== 'success' && <BackButton />}
            <div className="flex space-x-1">
              {(['email', 'otp', 'password'] as Step[]).map((s, i) => (
                <div 
                  key={s} 
                  className={`h-1 w-8 rounded-full transition-all duration-500 ${
                    ['email', 'otp', 'password', 'success'].indexOf(step) >= i 
                      ? "bg-slate-900 dark:bg-slate-100" 
                      : "bg-slate-100 dark:bg-slate-800"
                  }`}
                />
              ))}
            </div>
          </div>

          <Card className="shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950">
            <AnimatePresence mode="wait">
              {/* STEP 1: EMAIL */}
              {step === 'email' && (
                <motion.div
                  key="email-step"
                  variants={variants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                >
                  <CardHeader className="text-center pt-10 px-10">
                    <CardTitle className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                      Reset Password
                    </CardTitle>
                    <CardDescription className="text-base pt-3 font-medium text-slate-500 dark:text-slate-400">
                      Enter your email address and we'll send you a 4-digit verification code.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-10 pb-12">
                    <form onSubmit={handleEmailSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                          Email Address
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-12 pl-11 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-none"
                            required
                          />
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="w-full h-12 text-sm font-bold rounded-xl bg-slate-900 dark:bg-slate-50 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 shadow-none"
                        disabled={loading}
                      >
                        {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : "Send Code"}
                        {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                      </Button>
                    </form>
                  </CardContent>
                </motion.div>
              )}

              {/* STEP 2: OTP */}
              {step === 'otp' && (
                <motion.div
                  key="otp-step"
                  variants={variants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                >
                  <CardHeader className="text-center pt-10 px-10">
                    <div className="mx-auto h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-4">
                      <ShieldCheck className="h-6 w-6 text-slate-900 dark:text-slate-100" />
                    </div>
                    <CardTitle className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                      Check Your Email
                    </CardTitle>
                    <CardDescription className="text-base pt-3 font-medium text-slate-500 dark:text-slate-400">
                      We've sent an 8-digit code to <span className="text-slate-900 dark:text-slate-100 font-bold">{email}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-10 pb-8">
                    <form onSubmit={handleOtpSubmit} className="space-y-8">
                      <div className="flex justify-center gap-2 sm:gap-3">
                        {otp.map((digit, i) => (
                          <Input
                            key={i}
                            ref={otpRefs[i]}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(i, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(i, e)}
                            onPaste={handlePaste}
                            className="w-9 h-12 sm:w-11 sm:h-14 text-center text-xl sm:text-2xl font-black rounded-lg sm:rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:border-slate-900 dark:focus:border-slate-100 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-none px-0"
                          />
                        ))}
                      </div>
                      <Button
                        type="submit"
                        className="w-full h-12 text-sm font-bold rounded-xl bg-slate-900 dark:bg-slate-50 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 shadow-none"
                        disabled={loading}
                      >
                        {loading ? "Verifying..." : "Verify Code"}
                      </Button>
                    </form>
                  </CardContent>
                  <CardFooter className="flex flex-col items-center gap-4 pb-10">
                    <button 
                      type="button"
                      onClick={handleResendCode}
                      disabled={resendCooldown > 0 || resendLoading}
                      className="text-sm font-bold text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resendLoading ? (
                        <RefreshCw className="h-4 w-4 animate-spin inline mr-2" />
                      ) : null}
                      {resendCooldown > 0 
                        ? `Resend code in ${resendCooldown}s` 
                        : "Didn't get the code? Send again"}
                    </button>
                    
                    <button 
                      type="button"
                      onClick={() => setStep('email')}
                      className="text-[11px] font-bold text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors flex items-center gap-1.5"
                    >
                      <ArrowRight className="h-3 w-3 rotate-180" />
                      Try a different email
                    </button>
                  </CardFooter>
                </motion.div>
              )}

              {/* STEP 3: PASSWORD */}
              {step === 'password' && (
                <motion.div
                  key="password-step"
                  variants={variants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                >
                  <CardHeader className="text-center pt-10 px-10">
                    <div className="mx-auto h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-4">
                      <Lock className="h-6 w-6 text-slate-900 dark:text-slate-100" />
                    </div>
                    <CardTitle className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                      New Password
                    </CardTitle>
                    <CardDescription className="text-base pt-3 font-medium text-slate-500 dark:text-slate-400">
                      Create a new secure password for your account.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-10 pb-12">
                    <form onSubmit={handlePasswordSubmit} className="space-y-5">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                          New Password
                        </Label>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            className="h-12 pr-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-none"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                          Confirm Password
                        </Label>
                        <div className="relative">
                          <Input
                            type={showConfirm ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repeat new password"
                            className="h-12 pr-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-none"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
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
                        {loading ? "Updating..." : "Reset Password"}
                      </Button>
                    </form>
                  </CardContent>
                </motion.div>
              )}

              {/* STEP 4: SUCCESS */}
              {step === 'success' && (
                <motion.div
                  key="success-step"
                  variants={variants}
                  initial="initial"
                  animate="animate"
                  className="text-center py-12 px-10"
                >
                  <div className="mb-8 flex justify-center">
                    <div className="h-20 w-20 rounded-3xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-10 w-10" />
                    </div>
                  </div>
                  <h2 className="text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight mb-4">
                    All Set!
                  </h2>
                  <p className="text-lg text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed max-w-sm mx-auto">
                    Your password has been reset. You can now log back into your account.
                  </p>
                  <Button
                    className="w-full h-14 bg-slate-900 dark:bg-slate-50 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 text-base font-black rounded-2xl shadow-xl shadow-slate-900/10 dark:shadow-none"
                    onClick={() => router.push("/login")}
                  >
                    Continue to Login
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>
      </Container>
    </div>
  );
}
