/**
 * auth/confirm/page.tsx — Client-side Auth Confirmation
 *
 * This page handles the "confirm" step for email flows (signup, recovery, magic link).
 * It is a Client Component because Supabase often returns tokens in the URL hash (#),
 * which is invisible to the server-side callback routes.
 */

"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Container } from "@/components/layout/Container";
import { Loader2 } from "lucide-react";

export default function AuthConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    // onAuthStateChange handles both hash tokens and session refreshing
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const next = searchParams.get("next") ?? "/dashboard";

      if (event === "SIGNED_IN" || event === "PASSWORD_RECOVERY" || session) {
        router.push(next);
        router.refresh();
      }
    });

    // Proactive check: Don't just wait for the event, check right now
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const next = searchParams.get("next") ?? "/dashboard";
        router.push(next);
        router.refresh();
      }
    });

    // Fallback: If after 5 seconds nothing happens, redirect to login
    const timeout = setTimeout(() => {
      const next = searchParams.get("next");
      if (next === "/reset-password") {
        // If we were expecting to reset, maybe the session is already active?
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) router.push("/reset-password");
          else router.push("/login?error=link_expired");
        });
      }
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router, searchParams, supabase.auth]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-white dark:bg-slate-950">
      <Container>
        <div className="mx-auto max-w-sm text-center">
          <div className="mb-6 flex justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-slate-900 dark:text-slate-100" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight mb-2">
            Confirming...
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Please wait while we verify your secure link.
          </p>
        </div>
      </Container>
    </div>
  );
}
