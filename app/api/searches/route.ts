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

function errorResponse(
  status: number,
  payload: {
    id: string;
    creditCost?: ReturnType<typeof calculateLeadCreditCost>;
    remainingCredits: number | null;
    apiError: string;
    insufficientCredits?: boolean;
    upgradeMessage?: string;
  }
) {
  return NextResponse.json(
    {
      id: payload.id,
      saved: false,
      demoMode: false,
      insufficientCredits: Boolean(payload.insufficientCredits),
      upgradeMessage: payload.upgradeMessage,
      creditCost: payload.creditCost || { total: 0, uniqueLeadCredits: 0, emailCredits: 0 },
      remainingCredits: payload.remainingCredits,
      leads: [],
      source: "ZanScope",
      fallback: false,
      places_api_used: false,
      api_error: payload.apiError
    },
    { status }
  );
}

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

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("credits")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return errorResponse(500, {
      id: fallbackId,
      remainingCredits: null,
      apiError: `Could not read user credits from users.credits: ${profileError.message}`
    });
  }

  let currentCredits = profile?.credits ?? null;

  if (currentCredits === null) {
    const { data: createdProfile, error: createProfileError } = await supabase
      .from("users")
      .insert({
        id: user.id,
        email: user.email,
        plan: "Free",
        credits: 0
      })
      .select("credits")
      .single();

    if (createProfileError || !createdProfile) {
      return errorResponse(500, {
        id: fallbackId,
        remainingCredits: null,
        apiError: `Could not create missing user profile in users table: ${createProfileError?.message || "No profile returned"}`
      });
    }

    currentCredits = createdProfile.credits ?? 0;
  }

  if (currentCredits <= 0) {
    return errorResponse(402, {
      id: fallbackId,
      remainingCredits: currentCredits,
      insufficientCredits: true,
      upgradeMessage: `You need 1 credit. Your current balance is ${currentCredits}.`,
      apiError: `You need 1 credit. Your current balance is ${currentCredits}.`
    });
  }

  const [placesResult, webSearchResult] = await Promise.all([searchGooglePlaces(payload), searchApifyGoogle(payload)]);
  const discoveredLeads = [...placesResult.leads, ...webSearchResult.leads];
  const discoveryErrors = [placesResult.api_error, webSearchResult.error].filter(Boolean);

  if (placesResult.api_error && discoveredLeads.length === 0) {
    return errorResponse(placesResult.places_api_used ? 502 : 500, {
      id: fallbackId,
      remainingCredits: currentCredits,
      apiError: discoveryErrors.join(" | ") || placesResult.api_error
    });
  }

  if (webSearchResult.error && discoveredLeads.length === 0) {
    return errorResponse(502, {
      id: fallbackId,
      remainingCredits: currentCredits,
      apiError: webSearchResult.error
    });
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

  if (creditCost.total > currentCredits) {
    return errorResponse(402, {
      id: fallbackId,
      creditCost,
      remainingCredits: currentCredits,
      insufficientCredits: true,
      upgradeMessage: `You need ${creditCost.total} credits. Your current balance is ${currentCredits}.`,
      apiError: `You need ${creditCost.total} credits. Your current balance is ${currentCredits}.`
    });
  }

  const { data: search, error: searchInsertError } = await supabase
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

  if (searchInsertError || !search?.id) {
    return errorResponse(500, {
      id: fallbackId,
      creditCost,
      remainingCredits: currentCredits,
      apiError: `Could not save search: ${searchInsertError?.message || "No search id returned"}`
    });
  }

  const { data: chargeRows, error: chargeError } = await supabase.rpc("charge_user_credits", {
    p_user_id: user.id,
    p_amount: creditCost.total,
    p_type: "search_debit",
    p_description: `ZanScope search: ${payload.keyword || "Untitled search"}`
  });

  const charge = Array.isArray(chargeRows) ? (chargeRows[0] as CreditChargeResult | undefined) : undefined;

  if (chargeError || !charge?.success) {
    const remainingCredits = charge?.remaining_credits ?? currentCredits;
    const message = chargeError
      ? `Credit charge RPC failed: ${chargeError.message}`
      : `You need ${creditCost.total} credits. Your current balance is ${remainingCredits}.`;

    return errorResponse(chargeError ? 500 : 402, {
      id: search.id,
      creditCost,
      remainingCredits,
      insufficientCredits: !chargeError,
      upgradeMessage: message,
      apiError: message
    });
  }

  if (result.leads.length > 0) {
    const { data: insertedLeads, error: leadsInsertError } = await supabase.from("leads").insert(
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

    if (leadsInsertError) {
      return errorResponse(500, {
        id: search.id,
        creditCost,
        remainingCredits: charge.remaining_credits,
        apiError: `Credits were charged, but leads could not be saved: ${leadsInsertError.message}`
      });
    }

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
