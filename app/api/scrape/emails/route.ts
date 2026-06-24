import { NextResponse } from "next/server";
import { discoverEmailsForLeads } from "@/lib/email-discovery";
import { dedupeLeads } from "@/lib/lead-dedupe";
import { scoreLeads } from "@/lib/lead-scoring";
import { Lead } from "@/lib/dummy-data";

export async function POST(request: Request) {
  const payload = (await request.json()) as { leads?: Lead[] };
  const leads = Array.isArray(payload.leads) ? payload.leads : [];

  if (leads.length === 0) {
    return NextResponse.json({ leads: [] });
  }

  const enrichedLeads = scoreLeads(dedupeLeads(await discoverEmailsForLeads(leads)));
  return NextResponse.json({ leads: enrichedLeads });
}
