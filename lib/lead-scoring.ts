import { Lead } from "@/lib/dummy-data";

export type LeadQuality = "High Quality" | "Medium Quality" | "Low Quality";

export function getLeadQuality(score: number): LeadQuality {
  if (score >= 80) return "High Quality";
  if (score >= 50) return "Medium Quality";
  return "Low Quality";
}

const GENERIC_DOMAIN_PARTS = [
  "facebook.",
  "instagram.",
  "linkedin.",
  "youtube.",
  "youtu.be",
  "pinterest.",
  "reddit.",
  "wikipedia.",
  "yelp.",
  "yellowpages.",
  "tripadvisor.",
  "amazon.",
  "alibaba.",
  "aliexpress.",
  "ebay.",
  "etsy.",
  "medium.",
  "blogspot.",
  "wordpress.",
  "substack.",
  "notion.site",
  "sites.google."
];

const GENERIC_COMPANY_TERMS = [
  "unknown",
  "home",
  "contact",
  "about",
  "blog",
  "news",
  "article",
  "directory",
  "review",
  "reviews",
  "top 10",
  "best of",
  "how to"
];

function hostnameFromWebsite(website: string) {
  if (!website.trim()) return "";

  try {
    const url = new URL(website.startsWith("http") ? website : `https://${website}`);
    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isCleanCompanyDomain(website: string) {
  const hostname = hostnameFromWebsite(website);
  if (!hostname || !hostname.includes(".")) return false;
  return !GENERIC_DOMAIN_PARTS.some((part) => hostname.includes(part));
}

function isGenericDomain(website: string) {
  const hostname = hostnameFromWebsite(website);
  return Boolean(hostname && GENERIC_DOMAIN_PARTS.some((part) => hostname.includes(part)));
}

function companyNameLooksReal(companyName: string) {
  const normalized = companyName.trim().toLowerCase();
  if (normalized.length < 3) return false;
  if (!/[a-z]/i.test(normalized)) return false;
  return !GENERIC_COMPANY_TERMS.some((term) => normalized.includes(term));
}

export function calculateLeadScore(
  lead: Pick<
    Lead,
    "company_name" | "website" | "email" | "phone" | "address" | "source" | "scraper_status" | "internal_source_count"
  >
) {
  let score = 0;
  const source = lead.source.trim().toLowerCase();
  const hasWebsite = Boolean(lead.website);
  const hasEmail = Boolean(lead.email);
  const hasPhone = Boolean(lead.phone);
  const hasAddress = Boolean(lead.address);
  const internalSourceCount = lead.internal_source_count || 0;

  if (hasWebsite) score += 20;
  if (hasEmail) score += 30;
  if (hasPhone) score += 12;
  if (hasAddress) score += 8;
  if (source === "google places") score += 10;
  else if (source.includes("google places")) score += 10;
  else if (source && source !== "dummy directory") score += 5;
  if (lead.scraper_status === "found") score += 10;
  else if (lead.scraper_status === "failed") score -= 5;

  if (isCleanCompanyDomain(lead.website)) score += 8;
  if (isGenericDomain(lead.website)) score -= 20;
  if (companyNameLooksReal(lead.company_name)) score += 7;
  else score -= 10;

  if (hasEmail && hasPhone) score += 5;
  if (hasWebsite && hasEmail && hasPhone && hasAddress) score += 5;
  if (internalSourceCount > 1) score += Math.min(12, 6 + (internalSourceCount - 2) * 3);

  if (!hasWebsite && !hasEmail) score = Math.min(score, 40);
  if (!hasWebsite) score = Math.min(score, 75);
  if (isGenericDomain(lead.website)) score = Math.min(score, 45);

  const lead_score = Math.max(0, Math.min(score, 100));
  return {
    lead_score,
    lead_quality: getLeadQuality(lead_score)
  };
}

export function scoreLead<T extends Lead>(lead: T): T {
  return {
    ...lead,
    ...calculateLeadScore(lead)
  };
}

export function scoreLeads<T extends Lead>(leads: T[]) {
  return leads.map(scoreLead);
}

export function sortLeadsByScore<T extends Lead>(leads: T[]) {
  return [...leads].sort((a, b) => {
    if (b.lead_score !== a.lead_score) return b.lead_score - a.lead_score;
    return a.company_name.localeCompare(b.company_name);
  });
}
