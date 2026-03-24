/**
 * auth/callback/route.ts — OAuth Callback Handler
 *
 * Processes the authorization code returned by Google OAuth and exchanges
 * it for a Supabase session. After authentication, routes the user based on:
 *
 * 1. Profile incomplete  → /profile-setup
 * 2. Pending verification → /pending-approval
 * 3. super_admin role     → /super-admin
 * 4. org_admin role       → /admin
 * 5. Default              → /dashboard (or ?next= param)
 *
 * @module app/auth/callback
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();

    // Exchange the temporary OAuth code for a persistent session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if user has completed profile
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Fetch profile status to determine routing
        const { data: dbUser } = await supabase
          .from("users")
          .select("profile_completed, verification_status, role")
          .eq("id", user.id)
          .single<{ profile_completed: boolean; verification_status: string; role: string }>();

        if (dbUser) {
          // New user — needs profile setup
          if (!dbUser.profile_completed) {
            return NextResponse.redirect(`${origin}/profile-setup`);
          }

          // Pending verification — show pending page
          if (dbUser.verification_status === "pending") {
            return NextResponse.redirect(`${origin}/pending-approval`);
          }

          // Route based on role
          if (dbUser.role === "super_admin") {
            return NextResponse.redirect(`${origin}/super-admin`);
          }
          if (dbUser.role === "org_admin") {
            return NextResponse.redirect(`${origin}/admin`);
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // No code present or exchange failed — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
