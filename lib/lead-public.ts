import { Lead } from "@/lib/dummy-data";

export function sanitizeLeadsForUsers(leads: Lead[]): Lead[] {
  return leads.map((lead) => ({
    id: lead.id,
    company_name: lead.company_name,
    website: lead.website,
    email: lead.email,
    phone: lead.phone,
    address: lead.address,
    linkedin_url: lead.linkedin_url || "",
    city: lead.city,
    country: lead.country,
    source: "Zanscope",
    scraper_status: lead.scraper_status,
    duplicate_count: lead.duplicate_count,
    lead_score: lead.lead_score,
    lead_quality: lead.lead_quality,
    created_at: lead.created_at
  }));
}
