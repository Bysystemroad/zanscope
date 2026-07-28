import { NextResponse } from "next/server";
import { VERIFIED_ACCOUNT_REQUIRED_MESSAGE, isEmailVerified } from "@/lib/auth-security";
import { createSupabaseServerClient } from "@/lib/supabase/ssr";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to view enrichment jobs." }, { status: 401 });
  }

  if (!isEmailVerified(user)) {
    return NextResponse.json({ error: VERIFIED_ACCOUNT_REQUIRED_MESSAGE }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("enrichment_jobs")
    .select("id, file_name, row_count, unique_count, credit_cost, status, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ jobs: data || [] });
}
