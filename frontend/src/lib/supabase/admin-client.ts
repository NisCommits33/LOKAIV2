/**
 * admin-client.ts — Server-side Supabase admin client
 *
 * Creates a Supabase client using the service role key, which bypasses
 * Row Level Security. Only use in server-side API routes after verifying
 * the caller has the appropriate role (e.g. verifySuperAdmin).
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in environment variables.
 *
 * @module lib/supabase/admin-client
 */

import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase admin client that bypasses RLS.
 * ONLY use server-side, NEVER expose to the browser.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
