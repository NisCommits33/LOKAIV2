/**
 * admin.ts — Server-side admin role verification helpers
 *
 * Verifies that the current user has the required admin role.
 * Uses a SECURITY DEFINER RPC fallback if the direct query fails (RLS).
 *
 * @module lib/supabase/admin
 */

import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Fetches the user's role from the database.
 * Falls back to the get_user_role RPC if the direct query fails.
 */
async function getUserRole(
  supabase: SupabaseClient,
  userId: string
): Promise<{ role: string | null; organizationId: string | null }> {
  const { data: dbUser } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", userId)
    .single();

  if (dbUser) {
    return { role: dbUser.role, organizationId: dbUser.organization_id };
  }

  // Fallback: RPC bypasses RLS
  const { data: rpcRole } = await supabase.rpc("get_user_role", {
    user_id: userId,
  });

  return { role: rpcRole as string | null, organizationId: null };
}

/**
 * Checks if the authenticated user has the super_admin role.
 */
export async function verifySuperAdmin(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { role } = await getUserRole(supabase, userId);
  return role === "super_admin";
}

/**
 * Checks if the authenticated user has the organization role.
 * Returns the user's organization_id if verified, null otherwise.
 */
export async function verifyOrgAdmin(
  supabase: SupabaseClient,
  userId: string
): Promise<{ isAdmin: boolean; organizationId: string | null }> {
  const { role, organizationId } = await getUserRole(supabase, userId);
  const isAdmin = role === "org_admin" || role === "super_admin";
  return { isAdmin, organizationId };
}
