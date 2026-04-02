/**
 * register/page.tsx — User Registration Page
 *
 * Allows new users to create an account with email and password.
 * Also provides Google OAuth as an alternative signup method.
 *
 * After successful signup:
 * - If email confirmation is required: shows a confirmation message
 * - If auto-confirmed: redirects to /profile-setup
 *
 * The handle_new_user() DB trigger automatically creates the
 * public.users row when a new auth.users entry is inserted.
 *
 * @module app/register
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Spinner } from "@/components/loading";
import { Container } from "@/components/layout/Container";
import { BackButton } from "@/components/ui/back-button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Mail, CheckCircle2, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleGoogleSignup = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch {
      toast.error("Failed to sign up with Google. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!registeredEmail) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: registeredEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      toast.success("Confirmation email resent!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to resend email";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const fullName = (formData.get("fullName") as string).trim();
    const email = (formData.get("email") as string).trim();
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      if (data.session) {
        // Auto-confirmed — user is logged in immediately
        toast.success("Account created successfully!");
        router.push("/profile-setup");
      } else {
        // Email confirmation required
        setRegisteredEmail(email);
        setEmailSent(true);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Registration failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Email confirmation sent view
  if (emailSent) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center py-8 bg-white dark:bg-slate-950">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-lg"
          >
            <Card className="shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950">
              <CardContent className="p-10 text-center space-y-6">
                <div className="h-16 w-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center mx-auto">
                  <Mail className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                    Check your email
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-2 leading-relaxed">
                    We&apos;ve sent a confirmation link to{" "}
                    <span className="font-bold text-slate-700 dark:text-slate-300">{registeredEmail}</span>.
                    Click the link in the email to activate your account.
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 text-xs text-slate-500 dark:text-slate-400 font-medium space-y-1">
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    Check your spam folder if you don&apos;t see it
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    The link expires in 24 hours
                  </p>
                </div>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full h-11 text-sm font-bold rounded-xl border-slate-200 dark:border-slate-700 shadow-none hover:bg-slate-50 dark:hover:bg-slate-900"
                    onClick={() => router.push("/login")}
                  >
                    Back to Login
                  </Button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleResendEmail}
                    className="w-full text-xs font-bold text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors py-2 disabled:opacity-50"
                  >
                    {loading ? "Resending..." : "Didn't receive an email? Resend"}
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </Container>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center py-8 bg-white dark:bg-slate-950">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-lg"
        >
          <div className="mb-6">
            <BackButton />
          </div>

          <Card className="shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950">
            <CardHeader className="text-center pt-8 px-10">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 text-base font-bold">
                  L
                </div>
                <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">LokAI</span>
              </div>
              <CardTitle className="text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                Create Account
              </CardTitle>
              <CardDescription className="text-base pt-3 font-medium text-slate-500 dark:text-slate-400">
                Sign up to start your Lok Sewa preparation.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-10 pb-8 space-y-6">
              {/* Email/Password Registration Form */}
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="reg-name"
                    className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1"
                  >
                    Full Name
                  </Label>
                  <Input
                    id="reg-name"
                    name="fullName"
                    type="text"
                    placeholder="Your full name"
                    className="h-11 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-none"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="reg-email"
                    className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1"
                  >
                    Email
                  </Label>
                  <Input
                    id="reg-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    className="h-11 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-none"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="reg-password"
                    className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="reg-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 6 characters"
                      className="h-11 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-none pr-11"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="reg-confirm"
                    className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1"
                  >
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="reg-confirm"
                      name="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Re-enter your password"
                      className="h-11 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-none pr-11"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-bold rounded-xl bg-slate-900 dark:bg-slate-50 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 shadow-none mt-2"
                  disabled={loading}
                >
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-100 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                  <span className="bg-white dark:bg-slate-950 px-3 text-slate-400 font-bold">or</span>
                </div>
              </div>

              {/* Google OAuth */}
              <Button
                variant="outline"
                className="w-full h-12 gap-3 text-sm font-bold border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-all active:scale-[0.98] shadow-none"
                onClick={handleGoogleSignup}
                disabled={loading}
              >
                {loading ? (
                  <Spinner className="h-5 w-5" />
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 4.5 2.73 2.18 4.99l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                Sign up with Google
              </Button>
            </CardContent>
            <CardFooter className="flex justify-center border-t border-slate-50 dark:border-slate-800 py-6 bg-slate-50/20 dark:bg-slate-900/20 text-center px-10">
              <p className="text-xs text-slate-400 font-medium">
                Already have an account?{" "}
                <a
                  href="/login"
                  className="text-slate-900 dark:text-slate-100 font-bold hover:underline"
                >
                  Sign in
                </a>
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </Container>
    </div>
  );
}
