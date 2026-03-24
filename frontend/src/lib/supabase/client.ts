/**
 * client.ts — Browser-side Supabase client
 *
 * Creates a Supabase client for use in Client Components ("use client").
 * Uses the browser's cookie storage for session management.
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 * @module lib/supabase/client
 */

import { createBrowserClient } from "@supabase/ssr";

/**
 * Initializes and returns a Supabase browser client.
 * Safe to call multiple times — the SDK deduplicates internally.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
