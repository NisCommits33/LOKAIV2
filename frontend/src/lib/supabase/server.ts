/**
 * server.ts — Server-side Supabase client
 *
 * Creates a Supabase client for use in Server Components, Route Handlers,
 * and Server Actions. Reads/writes auth cookies via Next.js `cookies()` API.
 *
 * IMPORTANT: This must be called inside an async context (Server Component
 * or Route Handler) because it awaits the cookie store.
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 * @module lib/supabase/server
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates an authenticated server-side Supabase client.
 * The client automatically handles session token refresh via cookies.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll may be called from a Server Component where cookies
            // are read-only. This is safe to ignore — the middleware
            // handles session refresh on subsequent requests.
          }
        },
      },
    }
  );
}
