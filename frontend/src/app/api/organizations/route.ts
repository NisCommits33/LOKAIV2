/**
 * api/organizations/route.ts — Organizations API
 *
 * GET /api/organizations
 * Returns a list of active organizations (id, name, code) for use
 * in dropdown selectors. No authentication required — public endpoint.
 *
 * @module api/organizations
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, code")
    .eq("is_active", true)
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
