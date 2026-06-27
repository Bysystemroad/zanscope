import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(_request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to view enrichment results." }, { status: 401 });
  }

  const { data: job, error: jobError } = await supabase
    .from("enrichment_jobs")
    .select("id, file_name, row_count, unique_count, credit_cost, status, created_at, updated_at")
    .eq("id", jobId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (jobError) {
    return NextResponse.json({ error: jobError.message }, { status: 500 });
  }

  if (!job) {
    return NextResponse.json({ error: "Enrichment job not found." }, { status: 404 });
  }

  const { data: items, error: itemsError } = await supabase
    .from("enrichment_job_items")
    .select("*")
    .eq("job_id", jobId)
    .eq("user_id", user.id)
    .order("lead_score", { ascending: false });

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  return NextResponse.json({
    job,
    leads: (items || []).map((item) => ({
      id: item.lead_id || item.id,
      company_name: item.company_name || "",
      website: item.website || "",
      email: item.email || "",
      phone: item.phone || "",
      address: item.address || "",
      city: item.city || "",
      country: item.country || "",
      source: "Zanscope",
      scraper_status: item.enrichment_status === "Enriched" ? "found" : item.enrichment_status === "Failed" ? "failed" : "not_found",
      duplicate_count: item.duplicate_count || 1,
      lead_score: item.lead_score || 0,
      lead_quality: item.lead_quality || "Low Quality",
      created_at: item.created_at || new Date().toISOString()
    }))
  });
}
