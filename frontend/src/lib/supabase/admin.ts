/**
 * admin.ts — Server-side admin role verification helper
 *
 * Verifies that the current user has super_admin role.
 * Uses a SECURITY DEFINER RPC fallback if the direct query fails (RLS).
 *
 * @module lib/supabase/admin
 */

import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Checks if the authenticated user has the super_admin role.
 * Falls back to the get_user_role RPC if the direct users query fails.
 */
export async function verifySuperAdmin(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  // Try direct query first
  const { data: dbUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (dbUser?.role === "super_admin") return true;

  // Fallback: RPC bypasses RLS
  const { data: rpcRole } = await supabase.rpc("get_user_role", {
    user_id: userId,
  });

  return rpcRole === "super_admin";
}
