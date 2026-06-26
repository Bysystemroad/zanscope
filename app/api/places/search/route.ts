import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { searchApifyGoogle } from "@/lib/apify-search";
import { leads as demoLeads } from "@/lib/dummy-data";
import { discoverEmailsForLeads } from "@/lib/email-discovery";
import { dedupeLeads } from "@/lib/lead-dedupe";
import { sanitizeLeadsForUsers } from "@/lib/lead-public";
import { scoreLeads, sortLeadsByScore } from "@/lib/lead-scoring";
import { searchGooglePlaces } from "@/lib/google-places";

function publicSearchError(message?: string | null) {
  if (!message) return "Search service temporarily unavailable.";

  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("quota")) {
    return "Search capacity is temporarily limited. Please try again shortly.";
  }

  if (
    lowerMessage.includes("api") ||
    lowerMessage.includes("google") ||
    lowerMessage.includes("places") ||
    lowerMessage.includes("apify") ||
    lowerMessage.includes("token") ||
    lowerMessage.includes("key") ||
    lowerMessage.includes("env") ||
    lowerMessage.includes("internal discovery engine") ||
    lowerMessage.includes("internal web search")
  ) {
    return "Search service temporarily unavailable. Please try again.";
  }

  return message;
}

export async function POST(request: Request) {
  const payload = await request.json();
  const demoResponse = {
    demoMode: true,
    fallback: true,
    source: "Demo",
    places_api_used: false,
    api_error: null,
    leads: demoLeads
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

  const [result, webSearchResult] = await Promise.all([searchGooglePlaces(payload), searchApifyGoogle(payload)]);
  const discoveredLeads = [...result.leads, ...webSearchResult.leads];

  if (result.api_error && discoveredLeads.length === 0) {
    return NextResponse.json(
      {
        ...result,
        source: "ZanScope",
        api_error: publicSearchError(result.api_error)
      },
      { status: result.places_api_used ? 502 : 500 }
    );
  }

  const mergedLeads = dedupeLeads(discoveredLeads);
  const enrichedLeads = result.fallback ? mergedLeads : await discoverEmailsForLeads(mergedLeads);
  const leads = sanitizeLeadsForUsers(sortLeadsByScore(scoreLeads(dedupeLeads(enrichedLeads))));

  return NextResponse.json({
    ...result,
    source: "ZanScope",
    api_error: discoveredLeads.length > 0 ? null : publicSearchError(result.api_error),
    leads
  });
}
