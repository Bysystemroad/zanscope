import { NextResponse } from "next/server";
import { searchApifyGoogle } from "@/lib/apify-search";
import { discoverEmailsForLeads } from "@/lib/email-discovery";
import { dedupeLeads } from "@/lib/lead-dedupe";
import { sanitizeLeadsForUsers } from "@/lib/lead-public";
import { scoreLeads, sortLeadsByScore } from "@/lib/lead-scoring";
import { searchGooglePlaces } from "@/lib/google-places";

export async function POST(request: Request) {
  const payload = await request.json();
  const [result, webSearchResult] = await Promise.all([searchGooglePlaces(payload), searchApifyGoogle(payload)]);
  const discoveredLeads = [...result.leads, ...webSearchResult.leads];

  if (result.api_error && discoveredLeads.length === 0) {
    return NextResponse.json(result, { status: result.places_api_used ? 502 : 500 });
  }

  const mergedLeads = dedupeLeads(discoveredLeads);
  const enrichedLeads = result.fallback ? mergedLeads : await discoverEmailsForLeads(mergedLeads);
  const leads = sanitizeLeadsForUsers(sortLeadsByScore(scoreLeads(dedupeLeads(enrichedLeads))));

  return NextResponse.json({
    ...result,
    source: "ZanScope",
    api_error: discoveredLeads.length > 0 ? null : result.api_error,
    leads
  });
}
