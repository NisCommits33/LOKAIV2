/**
 * api/job-levels/route.ts — Job Levels API
 *
 * GET /api/job-levels?organization_id=<uuid>
 * Returns active job levels for a given organization, ordered by level_order
 * (ascending seniority). Requires the organization_id query parameter.
 *
 * @module api/job-levels
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
    .from("job_levels")
    .select("id, name, level_order")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("level_order");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
