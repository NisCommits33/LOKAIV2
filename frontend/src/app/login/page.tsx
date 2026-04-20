/**
 * login/page.tsx — Authentication Page
 *
 * Provides two login methods via a tabbed interface:
 * - "Personal" tab: Google OAuth for individual users
 * - "org_admin" tab: Email/password for organization admins
 *
 * After successful authentication, routes users based on their role
 * and verification status. Displays error messages from failed
 * OAuth callbacks via query parameters.
 *
 * @module app/login
 */

"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Container } from "@/components/layout/Container";
import { BackButton } from "@/components/ui/back-button";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Spinner } from "@/components/loading";
import { Eye, EyeOff } from "lucide-react";

/** Wraps LoginContent in Suspense for useSearchParams compatibility */
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginContent />
    </Suspense>
  );
}

/** Skeleton placeholder shown while the login form loads */
function LoginSkeleton() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center py-8 bg-white dark:bg-slate-950">
      <Container>
        <div className="mx-auto max-w-lg">
          <Card className="shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950">
            <CardHeader className="text-center pt-8 px-10">
              <div className="h-8 w-32 bg-slate-100 dark:bg-slate-800 rounded mx-auto animate-pulse" />
              <div className="h-4 w-48 bg-slate-50 dark:bg-slate-900 rounded mx-auto mt-3 animate-pulse" />
            </CardHeader>
          </Card>
        </div>
      </Container>
    </div>
  );
}

/** Main login form with Google OAuth and organization email/password tabs */
function LoginContent() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPersonalPw, setShowPersonalPw] = useState(false);
  const [showOrgPw, setShowOrgPw] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const supabase = createClient();

  /** Initiates Google OAuth sign-in flow */
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch {
      toast.error("Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /** Handles email/password login for org admins and super admins */
  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      // Determine user role — with RPC fallback if RLS blocks direct query
      let role: string | null = null;
      let verificationStatus: string | null = null;

      const { data: profileData } = await supabase
        .from("users")
        .select("role, verification_status")
        .eq("id", data.user.id)
        .single();

      if (profileData) {
        role = profileData.role;
        verificationStatus = profileData.verification_status;
      } else {
        // RLS may block the query — use SECURITY DEFINER function
        const { data: rpcRole } = await supabase.rpc("get_user_role", { user_id: data.user.id });
        role = rpcRole as string | null;
      }

      toast.success("Signed in successfully");

      if (role === "super_admin") {
        router.push("/super-admin");
      } else if (role === "org_admin") {
        if (verificationStatus === "verified") {
          router.push("/admin");
        } else {
          router.push("/pending-approval");
        }
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Login failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

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
            <CardHeader className="text-center pt-8 px-6 sm:px-10">
              <div className="flex items-center justify-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                  LOK.AI
                </h1>
              </div>
              <CardDescription className="text-base pt-3 font-medium text-slate-500 dark:text-slate-400">
                Sign in to your preparation portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 sm:px-10 pb-12">
              {error && (
                <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 p-3 text-sm text-red-600 dark:text-red-400 font-medium">
                  {error === "auth_callback_error"
                    ? "Authentication failed. Please try again."
                    : error === "account_deactivated"
                      ? "Your account has been deactivated. Please contact support."
                      : "An error occurred. Please try again."}
                </div>
              )}

              <Tabs defaultValue="individual" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 h-11 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl">
                  <TabsTrigger
                    value="individual"
                    className="rounded-lg font-bold text-[10px] uppercase tracking-wider data-[selected]:bg-white dark:data-[selected]:bg-slate-800 data-[selected]:text-slate-900 dark:data-[selected]:text-slate-50 data-[selected]:shadow-sm transition-all"
                  >
                    Personal
                  </TabsTrigger>
                  <TabsTrigger
                    value="org_admin"
                    className="rounded-lg font-bold text-[10px] uppercase tracking-wider data-[selected]:bg-white dark:data-[selected]:bg-slate-800 data-[selected]:text-slate-900 dark:data-[selected]:text-slate-50 data-[selected]:shadow-sm transition-all"
                  >
                    Organization
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="individual" className="space-y-8 outline-none">
                  <div className="space-y-6">
                    {/* Email/Password Login */}
                    <form onSubmit={handleEmailLogin} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="personal-email"
                          className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1"
                        >
                          Email
                        </Label>
                        <Input
                          id="personal-email"
                          name="email"
                          type="email"
                          placeholder="you@example.com"
                          className="h-11 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-none"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="personal-password"
                          className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1"
                        >
                          Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="personal-password"
                            name="password"
                            type={showPersonalPw ? "text" : "password"}
                            className="h-11 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-none pr-11"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPersonalPw(!showPersonalPw)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            tabIndex={-1}
                          >
                            {showPersonalPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <div className="flex justify-end pt-1">
                          <Link
                            href="/forgot-password"
                            className="text-[11px] font-bold text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                          >
                            Forgot your password?
                          </Link>
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="w-full h-11 text-sm font-bold rounded-xl bg-slate-900 dark:bg-slate-50 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 shadow-none mt-2"
                        disabled={loading}
                      >
                        {loading ? "Signing in..." : "Sign In"}
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

                    <Button
                      variant="outline"
                      className="w-full h-12 gap-3 text-sm font-bold border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-all active:scale-[0.98] shadow-none"
                      onClick={handleGoogleLogin}
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
                      Continue with Google
                    </Button>

                    <p className="text-center text-xs text-slate-400 font-medium">
                      Don&apos;t have an account?{" "}
                      <a
                        href="/register"
                        className="text-slate-900 dark:text-slate-100 font-bold hover:underline"
                      >
                        Create one
                      </a>
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="org_admin" className="outline-none">
                  <form onSubmit={handleEmailLogin} className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="org-email"
                          className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1"
                        >
                          Official Email
                        </Label>
                        <Input
                          id="org-email"
                          name="email"
                          type="email"
                          placeholder="admin@gov.np"
                          className="h-11 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-none"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="org-password"
                          className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1"
                        >
                          Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="org-password"
                            name="password"
                            type={showOrgPw ? "text" : "password"}
                            className="h-11 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-none pr-11"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowOrgPw(!showOrgPw)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            tabIndex={-1}
                          >
                            {showOrgPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <div className="flex justify-end pt-1">
                          <Link
                            href="/forgot-password"
                            className="text-[11px] font-bold text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                          >
                            Forgot your password?
                          </Link>
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="w-full h-11 text-sm font-bold rounded-xl bg-slate-900 dark:bg-slate-50 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 shadow-none mt-2"
                        disabled={loading}
                      >
                        {loading ? "Verifying..." : "Enter Portal"}
                      </Button>
                    </div>
                    <p className="text-center text-xs text-slate-400 font-medium pt-4">
                      Don&apos;t have an organization?{" "}
                      <a
                        href="/register-organization"
                        className="text-slate-900 dark:text-slate-100 font-bold hover:underline"
                      >
                        Register here
                      </a>
                    </p>
                  </form>
                </TabsContent>


              </Tabs>
            </CardContent>

          </Card>
        </motion.div>
      </Container>
    </div>
  );
}
