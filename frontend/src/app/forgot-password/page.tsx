/**
 * forgot-password/page.tsx — Password Recovery Request Page
 *
 * Allows users to request a password reset email by providing their email address.
 * Uses Supabase's auth.resetPasswordForEmail() method.
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
import { BackButton } from "@/components/ui/back-button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Mail, ArrowRight } from "lucide-react";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const supabase = createClient();
  const router = useRouter();

  const handleResetRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success("Recovery email sent!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send recovery email";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center py-8 bg-white">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-lg text-center"
          >
            <div className="mb-6 flex justify-center">
              <div className="h-16 w-16 rounded-2xl bg-slate-900 flex items-center justify-center text-white">
                <Mail className="h-8 w-8" />
              </div>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">
              Check your email
            </h1>
            <p className="text-slate-500 font-medium mb-8 leading-relaxed">
              We've sent a password recovery link to <span className="text-slate-900 font-bold">{email}</span>. 
              Click the link in the email to reset your password.
            </p>
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full h-11 rounded-xl border-slate-200 font-bold shadow-none"
                onClick={() => setSubmitted(false)}
              >
                Use a different email
              </Button>
              <Button
                variant="ghost"
                className="w-full h-11 text-slate-500 font-bold"
                onClick={() => router.push("/login")}
              >
                Back to Login
              </Button>
            </div>
          </motion.div>
        </Container>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center py-8 bg-white">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-lg"
        >
          <div className="mb-6">
            <BackButton />
          </div>

          <Card className="shadow-none border border-slate-100 overflow-hidden bg-white">
            <CardHeader className="text-center pt-8 px-10">
              <CardTitle className="text-3xl font-black text-slate-900 tracking-tight">
                Reset Password
              </CardTitle>
              <CardDescription className="text-base pt-3 font-medium text-slate-500">
                Enter your email address and we'll send you a link to reset your password.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-10 pb-12">
              <form onSubmit={handleResetRequest} className="space-y-6">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="email"
                    className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1"
                  >
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 rounded-xl border-slate-100 bg-slate-50/30 focus:bg-white transition-all shadow-none"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-none mt-2"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Recovery Link"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center border-t border-slate-50 py-6 bg-slate-50/20 text-center px-10">
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                If the email doesn't arrive within 5 minutes, please check your spam folder.
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </Container>
    </div>
  );
}
