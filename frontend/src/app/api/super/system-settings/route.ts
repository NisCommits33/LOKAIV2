import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  
  if (!profile || profile.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  const { data, error } = await supabase.from("system_settings").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  try {
      const updates = await request.json(); // Array of { key, value }
      
      const { error } = await supabase
         .from("system_settings")
         .upsert(
            updates.map((u: { key: string; value: string }) => ({
                key: u.key,
                value: u.value,
                updated_by: user.id
            }))
         );

      if (error) throw error;

      // Log the update
      await supabase.from("audit_logs").insert({
          user_id: user.id,
          action: "UPDATED_SYSTEM_SETTINGS",
          details: { updates }
      });

      return NextResponse.json({ message: "Settings saved successfully" });

  } catch (err: unknown) {
      if (err instanceof Error) return NextResponse.json({ error: err.message }, { status: 500 });
      return NextResponse.json({ error: "Unknown error occurred" }, { status: 500 });
  }
}
