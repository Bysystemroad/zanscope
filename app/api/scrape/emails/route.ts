import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { discoverEmailsForLeads } from "@/lib/email-discovery";
import { dedupeLeads } from "@/lib/lead-dedupe";
import { scoreLeads } from "@/lib/lead-scoring";
import { Lead } from "@/lib/dummy-data";
import { VERIFIED_ACCOUNT_REQUIRED_MESSAGE, isEmailVerified } from "@/lib/auth-security";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { assertSafePublicHttpUrl } from "@/lib/url-security";

const MAX_LEADS_PER_REQUEST = 25;
const MAX_TEXT_LENGTH = 300;

function cleanLead(lead: Lead) {
  return {
    ...lead,
    company_name: String(lead.company_name || "").slice(0, MAX_TEXT_LENGTH),
    website: String(lead.website || "").slice(0, 2048),
    email: String(lead.email || "").slice(0, MAX_TEXT_LENGTH),
    phone: String(lead.phone || "").slice(0, MAX_TEXT_LENGTH),
    address: String(lead.address || "").slice(0, 1000),
    city: String(lead.city || "").slice(0, MAX_TEXT_LENGTH),
    country: String(lead.country || "").slice(0, MAX_TEXT_LENGTH)
  } satisfies Lead;
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to enrich leads." }, { status: 401 });
  }

  if (!isEmailVerified(user)) {
    return NextResponse.json({ error: VERIFIED_ACCOUNT_REQUIRED_MESSAGE }, { status: 403 });
  }

  const rateLimit = checkRateLimit(request, "scrape-emails", { limit: 10, windowMs: 60_000 }, user.id);
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.retryAfter);

  const payload = (await request.json()) as { leads?: Lead[] };
  const leads = Array.isArray(payload.leads) ? payload.leads.slice(0, MAX_LEADS_PER_REQUEST).map(cleanLead) : [];

  if (Array.isArray(payload.leads) && payload.leads.length > MAX_LEADS_PER_REQUEST) {
    return NextResponse.json({ error: `A maximum of ${MAX_LEADS_PER_REQUEST} leads can be enriched at once.` }, { status: 400 });
  }

  if (leads.length === 0) {
    return NextResponse.json({ leads: [] });
  }

  const invalidWebsite = (
    await Promise.all(
      leads.filter((lead) => lead.website).map(async (lead) => (await assertSafePublicHttpUrl(lead.website)) ? null : lead.website)
    )
  ).find(Boolean);

  if (invalidWebsite) {
    return NextResponse.json({ error: "One or more websites could not be safely enriched." }, { status: 400 });
  }

  const enrichedLeads = scoreLeads(dedupeLeads(await discoverEmailsForLeads(leads)));
  return NextResponse.json({ leads: enrichedLeads });
}
