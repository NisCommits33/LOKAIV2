/**
 * api/documents/route.ts — Document Listing API
 *
 * GET /api/documents
 * Returns the authenticated user's documents with pagination, search, and filters.
 *
 * Query params: search, status, limit, offset, sort (created_at | title)
 *
 * @module api/documents
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const ALLOWED_SORT = ["created_at", "title"] as const;
  const sortParam = searchParams.get("sort") || "created_at";
  const sort = ALLOWED_SORT.includes(sortParam as any) ? sortParam : "created_at";
  
  const search = (searchParams.get("search") || "").trim().slice(0, 200);
  const status = searchParams.get("status");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  let query = supabase
    .from("personal_documents")
    .select("id, title, description, file_name, file_size, mime_type, processing_status, processing_error, created_at, updated_at", { count: "exact" })
    .eq("user_id", user.id)
    .order(sort === "title" ? "title" : "created_at", { ascending: sort === "title" })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  if (status) {
    query = query.eq("processing_status", status);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("[API Error] Document fetching failed:", error.message);
    return NextResponse.json({ error: "Failed to fetch documents due to an internal error." }, { status: 500 });
  }

  return NextResponse.json({ documents: data, total: count ?? 0 });
}
