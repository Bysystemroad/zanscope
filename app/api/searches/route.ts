import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { searchApifyGoogle } from "@/lib/apify-search";
import { calculateLeadCreditCost } from "@/lib/credits";
import { leads as demoLeads } from "@/lib/dummy-data";
import { discoverEmailsForLeads } from "@/lib/email-discovery";
import { dedupeLeads } from "@/lib/lead-dedupe";
import { sanitizeLeadsForUsers } from "@/lib/lead-public";
import { scoreLeads, sortLeadsByScore } from "@/lib/lead-scoring";
import { searchGooglePlaces } from "@/lib/google-places";

type SearchPayload = {
  keyword: string;
  country?: string;
  city?: string;
  industry?: string;
};

type CreditChargeResult = {
  success: boolean;
  remaining_credits: number;
};

export async function POST(request: Request) {
  const payload = (await request.json()) as SearchPayload;
  const fallbackId = crypto.randomUUID();
  const demoResponse = {
    id: fallbackId,
    saved: false,
    demoMode: true,
    fallback: true,
    source: "Demo",
    places_api_used: false,
    api_error: null,
    leads: demoLeads,
    creditCost: { total: 0, uniqueLeadCredits: 0, emailCredits: 0 },
    remainingCredits: null
  };

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json(demoResponse);
  }

  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(demoResponse);
  }

  const [placesResult, webSearchResult] = await Promise.all([searchGooglePlaces(payload), searchApifyGoogle(payload)]);
  const discoveredLeads = [...placesResult.leads, ...webSearchResult.leads];

  if (placesResult.api_error && discoveredLeads.length === 0) {
    return NextResponse.json(
      {
        id: fallbackId,
        saved: false,
        creditCost: { total: 0, uniqueLeadCredits: 0, emailCredits: 0 },
        remainingCredits: null,
        ...placesResult
      },
      { status: placesResult.places_api_used ? 502 : 500 }
    );
  }

  const mergedLeads = dedupeLeads(discoveredLeads);
  const enrichedLeads = placesResult.fallback ? mergedLeads : await discoverEmailsForLeads(mergedLeads);
  const finalLeads = sanitizeLeadsForUsers(sortLeadsByScore(scoreLeads(dedupeLeads(enrichedLeads))));
  const result = {
    ...placesResult,
    demoMode: false,
    source: "ZanScope",
    api_error: discoveredLeads.length > 0 ? null : placesResult.api_error,
    leads: finalLeads
  };
  const creditCost = calculateLeadCreditCost(result.leads);

  const { data: profile } = await supabase.from("users").select("credits").eq("id", user.id).maybeSingle();

  if (!profile) {
    await supabase.from("users").insert({
      id: user.id,
      email: user.email,
      plan: "Free",
      credits: 100
    });
  }

  const { data: currentProfile } = await supabase.from("users").select("credits").eq("id", user.id).single();
  const currentCredits = currentProfile?.credits ?? 0;

  if (creditCost.total > currentCredits) {
    return NextResponse.json(
      {
        id: fallbackId,
        saved: false,
        insufficientCredits: true,
        upgradeMessage: `This search needs ${creditCost.total} credits. Upgrade or buy credits to save these leads.`,
        creditCost,
        remainingCredits: currentCredits,
        leads: [],
        source: result.source,
        fallback: result.fallback,
        places_api_used: result.places_api_used,
        api_error: result.api_error
      },
      { status: 402 }
    );
  }

  const { data: search } = await supabase
    .from("searches")
    .insert({
      user_id: user.id,
      keyword: payload.keyword,
      country: payload.country,
      city: payload.city,
      industry: payload.industry,
      credit_cost: creditCost.total,
      status: "complete"
    })
    .select("id")
    .single();

  if (!search?.id) {
    return NextResponse.json(
      {
        id: fallbackId,
        saved: false,
        creditCost,
        remainingCredits: currentCredits,
        leads: [],
        source: result.source,
        fallback: result.fallback,
        places_api_used: result.places_api_used,
        api_error: result.api_error
      },
      { status: 500 }
    );
  }

  const { data: chargeRows, error: chargeError } = await supabase.rpc("charge_user_credits", {
    p_user_id: user.id,
    p_amount: creditCost.total,
    p_type: "search_debit",
    p_description: `ZanScope search: ${payload.keyword || "Untitled search"}`
  });

  const charge = Array.isArray(chargeRows) ? (chargeRows[0] as CreditChargeResult | undefined) : undefined;

  if (chargeError || !charge?.success) {
    return NextResponse.json(
      {
        id: search.id,
        saved: false,
        insufficientCredits: true,
        upgradeMessage: `This search needs ${creditCost.total} credits. Upgrade or buy credits to save these leads.`,
        creditCost,
        remainingCredits: charge?.remaining_credits ?? currentCredits,
        leads: [],
        source: result.source,
        fallback: result.fallback,
        places_api_used: result.places_api_used,
        api_error: result.api_error
      },
      { status: 402 }
    );
  }

  if (result.leads.length > 0) {
    const { data: insertedLeads } = await supabase.from("leads").insert(
      result.leads.map((lead) => ({
        search_id: search.id,
        company_name: lead.company_name,
        website: lead.website,
        email: lead.email,
        phone: lead.phone,
        address: lead.address,
        city: payload.city || lead.city,
        country: payload.country || lead.country,
        source: lead.source,
        scraper_status: lead.scraper_status,
        duplicate_count: lead.duplicate_count,
        lead_score: lead.lead_score,
        lead_quality: lead.lead_quality
      }))
    ).select("*");

    if (insertedLeads) {
      result.leads = insertedLeads.map((lead) => ({
        id: lead.id,
        company_name: lead.company_name || "",
        website: lead.website || "",
        email: lead.email || "",
        phone: lead.phone || "",
        address: lead.address || "",
        city: lead.city || "",
        country: lead.country || "",
        source: "ZanScope",
        scraper_status: lead.scraper_status || "pending",
        duplicate_count: lead.duplicate_count || 1,
        lead_score: lead.lead_score || 0,
        lead_quality: lead.lead_quality || "Low Quality",
        created_at: lead.created_at || new Date().toISOString()
      }));
    }
  }

  return NextResponse.json({
    id: search.id,
    saved: true,
    creditCost,
    remainingCredits: charge.remaining_credits,
    ...result
  });
}
