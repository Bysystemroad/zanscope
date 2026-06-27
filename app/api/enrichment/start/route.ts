import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { searchApifyGoogle } from "@/lib/apify-search";
import { calculateLeadCreditCost } from "@/lib/credits";
import type { CsvRow } from "@/lib/csv-upload";
import type { Lead } from "@/lib/dummy-data";
import { discoverEmailsForLeads } from "@/lib/email-discovery";
import { searchGooglePlaces } from "@/lib/google-places";
import { dedupeLeads } from "@/lib/lead-dedupe";
import { sanitizeLeadsForUsers } from "@/lib/lead-public";
import { scoreLeads, sortLeadsByScore } from "@/lib/lead-scoring";
import { ensureUserProfile } from "@/lib/supabase/profile";

type Mapping = {
  companyName: string;
  website?: string;
  country?: string;
  city?: string;
  email?: string;
  phone?: string;
};

type StartPayload = {
  fileName?: string;
  rows?: CsvRow[];
  mapping?: Mapping;
};

type CreditChargeResult = {
  success: boolean;
  remaining_credits: number;
};

function value(row: CsvRow, column?: string) {
  return column ? row[column]?.trim() || "" : "";
}

function normalizeWebsite(website: string) {
  if (!website.trim()) return "";
  try {
    return new URL(website.startsWith("http") ? website : `https://${website}`).toString();
  } catch {
    return website;
  }
}

function csvRowsToLeads(rows: CsvRow[], mapping: Mapping): Lead[] {
  return rows
    .map((row, index) => {
      const companyName = value(row, mapping.companyName);
      if (!companyName) return null;

      const email = value(row, mapping.email);
      const lead: Lead = {
        id: `upload_${index + 1}_${crypto.randomUUID()}`,
        company_name: companyName,
        website: normalizeWebsite(value(row, mapping.website)),
        email,
        phone: value(row, mapping.phone),
        address: "",
        city: value(row, mapping.city),
        country: value(row, mapping.country),
        source: "Zanscope",
        scraper_status: email ? "found" : "pending",
        duplicate_count: 1,
        lead_score: 0,
        lead_quality: "Low Quality",
        internal_sources: ["Uploaded list"],
        internal_source_count: 1,
        created_at: new Date().toISOString()
      };

      return lead;
    })
    .filter((lead): lead is Lead => lead !== null);
}

async function discoverMissingCompanyData(lead: Lead) {
  if (lead.website) return lead;

  const [placesResult, webResult] = await Promise.all([
    lead.city && lead.country
      ? searchGooglePlaces({ keyword: lead.company_name, city: lead.city, country: lead.country })
      : Promise.resolve({ leads: [] }),
    searchApifyGoogle({
      keyword: lead.company_name,
      city: lead.city,
      country: lead.country
    })
  ]);

  const candidate = [...placesResult.leads, ...webResult.leads][0];
  if (!candidate) return lead;

  return {
    ...lead,
    website: lead.website || candidate.website,
    email: lead.email || candidate.email,
    phone: lead.phone || candidate.phone,
    address: lead.address || candidate.address,
    city: lead.city || candidate.city,
    country: lead.country || candidate.country,
    source: "Zanscope Intelligence",
    internal_sources: ["Uploaded list", "Business intelligence engine"],
    internal_source_count: 2
  } satisfies Lead;
}

async function enrichLeads(inputLeads: Lead[]) {
  const discovered = await Promise.all(inputLeads.map(discoverMissingCompanyData));
  const deduped = dedupeLeads(discovered);
  const enriched = await discoverEmailsForLeads(deduped);
  return sanitizeLeadsForUsers(sortLeadsByScore(scoreLeads(dedupeLeads(enriched))));
}

function statusForLead(lead: Lead) {
  if (lead.email && lead.website) return "Enriched";
  if (lead.website || lead.email || lead.phone) return "Partial";
  if (lead.scraper_status === "failed") return "Failed";
  return "Not Found";
}

function cleanErrorMessage(message: string) {
  return message
    .replace(/Google Places|Google Maps|Google API|Places API|Google Search|Google/gi, "Business Intelligence Engine")
    .replace(/Apify/gi, "Internal Discovery Engine")
    .replace(/\bAPI\b/g, "service");
}

export async function POST(request: Request) {
  const payload = (await request.json()) as StartPayload;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ demoMode: true, error: "Log in to enrich your own company lists." }, { status: 401 });
  }

  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ demoMode: true, error: "Log in to enrich your own company lists." }, { status: 401 });
  }

  const rows = (payload.rows || []).slice(0, 100);
  const mapping = payload.mapping;

  if (!mapping?.companyName) {
    return NextResponse.json({ error: "Map the required Company Name column before starting enrichment." }, { status: 400 });
  }

  const inputLeads = csvRowsToLeads(rows, mapping);

  if (inputLeads.length === 0) {
    return NextResponse.json({ error: "No valid company rows were found." }, { status: 400 });
  }

  let profile;
  try {
    profile = await ensureUserProfile(supabase, user);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const uniqueInputLeads = dedupeLeads(inputLeads);

  if (profile.credits < uniqueInputLeads.length) {
    return NextResponse.json(
      {
        insufficientCredits: true,
        error: `This enrichment needs at least ${uniqueInputLeads.length} credits. Your current balance is ${profile.credits}.`,
        requiredCredits: uniqueInputLeads.length,
        remainingCredits: profile.credits
      },
      { status: 402 }
    );
  }

  let finalLeads: Lead[];
  try {
    finalLeads = await enrichLeads(uniqueInputLeads);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `List Enrichment could not be completed: ${cleanErrorMessage(message)}` }, { status: 500 });
  }
  const creditCost = calculateLeadCreditCost(finalLeads);

  if (creditCost.total > profile.credits) {
    return NextResponse.json(
      {
        insufficientCredits: true,
        error: `This enrichment needs ${creditCost.total} credits. Your current balance is ${profile.credits}.`,
        requiredCredits: creditCost.total,
        remainingCredits: profile.credits
      },
      { status: 402 }
    );
  }

  const { data: job, error: jobError } = await supabase
    .from("enrichment_jobs")
    .insert({
      user_id: user.id,
      file_name: payload.fileName || "uploaded-list.csv",
      row_count: inputLeads.length,
      unique_count: finalLeads.length,
      credit_cost: creditCost.total,
      status: "complete"
    })
    .select("id, created_at")
    .single();

  if (jobError || !job?.id) {
    return NextResponse.json({ error: `Could not save enrichment job: ${jobError?.message || "No job id returned"}` }, { status: 500 });
  }

  const { data: savedLeads, error: savedLeadsError } = await supabase
    .from("leads")
    .insert(
      finalLeads.map((lead) => ({
        user_id: user.id,
        search_id: null,
        company_name: lead.company_name,
        website: lead.website,
        email: lead.email,
        phone: lead.phone,
        address: lead.address,
        city: lead.city,
        country: lead.country,
        source: "Zanscope",
        scraper_status: lead.scraper_status,
        duplicate_count: lead.duplicate_count,
        lead_score: lead.lead_score,
        lead_quality: lead.lead_quality
      }))
    )
    .select("*");

  if (savedLeadsError || !savedLeads) {
    await supabase.from("enrichment_jobs").delete().eq("id", job.id).eq("user_id", user.id);
    return NextResponse.json({ error: `Enriched leads could not be saved, so credits were not charged: ${savedLeadsError?.message || "No leads returned"}` }, { status: 500 });
  }

  const { error: itemError } = await supabase.from("enrichment_job_items").insert(
    finalLeads.map((lead, index) => ({
      job_id: job.id,
      user_id: user.id,
      lead_id: savedLeads[index]?.id,
      company_name: lead.company_name,
      input_website: uniqueInputLeads[index]?.website || "",
      input_email: uniqueInputLeads[index]?.email || "",
      input_phone: uniqueInputLeads[index]?.phone || "",
      website: lead.website,
      email: lead.email,
      phone: lead.phone,
      address: lead.address,
      city: lead.city,
      country: lead.country,
      lead_score: lead.lead_score,
      lead_quality: lead.lead_quality,
      enrichment_status: statusForLead(lead),
      duplicate_count: lead.duplicate_count
    }))
  );

  if (itemError) {
    await supabase.from("leads").delete().eq("user_id", user.id).in("id", savedLeads.map((lead) => lead.id));
    await supabase.from("enrichment_jobs").delete().eq("id", job.id).eq("user_id", user.id);
    return NextResponse.json({ error: `Enrichment items could not be saved, so credits were not charged: ${itemError.message}` }, { status: 500 });
  }

  const { data: chargeRows, error: chargeError } = await supabase.rpc("charge_user_credits", {
    p_user_id: user.id,
    p_amount: creditCost.total,
    p_type: "enrichment_debit",
    p_description: `Zanscope list enrichment: ${payload.fileName || "uploaded-list.csv"}`
  });

  const charge = Array.isArray(chargeRows) ? (chargeRows[0] as CreditChargeResult | undefined) : undefined;

  if (chargeError || !charge?.success) {
    await supabase.from("leads").delete().eq("user_id", user.id).in("id", savedLeads.map((lead) => lead.id));
    await supabase.from("enrichment_jobs").delete().eq("id", job.id).eq("user_id", user.id);
    return NextResponse.json(
      {
        insufficientCredits: !chargeError,
        error: chargeError?.message || `This enrichment needs ${creditCost.total} credits. Your current balance is ${charge?.remaining_credits ?? profile.credits}.`,
        requiredCredits: creditCost.total,
        remainingCredits: charge?.remaining_credits ?? profile.credits
      },
      { status: chargeError ? 500 : 402 }
    );
  }

  return NextResponse.json({
    id: job.id,
    saved: true,
    creditCost,
    remainingCredits: charge.remaining_credits,
    leads: savedLeads.map((lead) => ({
      id: lead.id,
      company_name: lead.company_name || "",
      website: lead.website || "",
      email: lead.email || "",
      phone: lead.phone || "",
      address: lead.address || "",
      city: lead.city || "",
      country: lead.country || "",
      source: "Zanscope",
      scraper_status: lead.scraper_status || "pending",
      duplicate_count: lead.duplicate_count || 1,
      lead_score: lead.lead_score || 0,
      lead_quality: lead.lead_quality || "Low Quality",
      created_at: lead.created_at || new Date().toISOString()
    }))
  });
}
