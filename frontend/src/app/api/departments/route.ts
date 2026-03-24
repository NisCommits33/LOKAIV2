/**
 * api/departments/route.ts — Departments API
 *
 * GET /api/departments?organization_id=<uuid>
 * Returns active departments for a given organization, ordered by display_order.
 * Requires the organization_id query parameter.
 *
 * @module api/departments
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const organizationId = request.nextUrl.searchParams.get("organization_id");

  if (!organizationId) {
    return NextResponse.json(
      { error: "organization_id query parameter is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("departments")
    .select("id, name, code, display_order")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("display_order");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
