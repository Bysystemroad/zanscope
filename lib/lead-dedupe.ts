import { Lead } from "@/lib/dummy-data";

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\b(inc|llc|ltd|limited|corp|corporation|company|co|gmbh|ag|sa|srl|bv)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function websiteDomain(website: string) {
  if (!website.trim()) return "";

  try {
    const url = new URL(website.startsWith("http") ? website : `https://${website}`);
    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function cleanHomepage(website: string) {
  if (!website.trim()) return "";

  try {
    const url = new URL(website.startsWith("http") ? website : `https://${website}`);
    url.protocol = "https:";
    url.username = "";
    url.password = "";
    url.hash = "";
    url.search = "";
    url.pathname = "/";
    return url.toString();
  } catch {
    return website;
  }
}

function isHomepage(website: string) {
  if (!website.trim()) return false;

  try {
    const url = new URL(website.startsWith("http") ? website : `https://${website}`);
    return url.pathname === "/" || url.pathname === "";
  } catch {
    return false;
  }
}

function levenshtein(a: string, b: string) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

  for (let i = 0; i < rows; i += 1) matrix[i][0] = i;
  for (let j = 0; j < cols; j += 1) matrix[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }

  return matrix[a.length][b.length];
}

function similarity(a: string, b: string) {
  if (!a && !b) return 1;
  if (!a || !b) return 0;

  const maxLength = Math.max(a.length, b.length);
  return 1 - levenshtein(a, b) / maxLength;
}

function areSimilarByCompanyAndCity(a: Lead, b: Lead) {
  const cityA = normalizeText(a.city);
  const cityB = normalizeText(b.city);
  const companyA = normalizeText(a.company_name);
  const companyB = normalizeText(b.company_name);

  if (!cityA || !cityB || !companyA || !companyB) return false;

  const citySimilar = cityA === cityB || similarity(cityA, cityB) >= 0.82;
  const companySimilar = companyA === companyB || similarity(companyA, companyB) >= 0.86;

  return citySimilar && companySimilar;
}

function shouldPrefer(candidate: Lead, current: Lead) {
  if (Boolean(candidate.email) !== Boolean(current.email)) return Boolean(candidate.email);
  if (Boolean(candidate.phone) !== Boolean(current.phone)) return Boolean(candidate.phone);
  if (Boolean(candidate.website) !== Boolean(current.website)) return Boolean(candidate.website);
  if (Boolean(candidate.address) !== Boolean(current.address)) return Boolean(candidate.address);
  if (Boolean(candidate.description) !== Boolean(current.description)) return Boolean(candidate.description);
  return candidate.company_name.length > current.company_name.length;
}

function uniqueSources(...leads: Lead[]) {
  return Array.from(
    new Set(
      leads.flatMap((lead) => {
        const sources = lead.internal_sources?.length ? lead.internal_sources : [lead.source];
        return sources.map((source) => source.trim()).filter(Boolean);
      })
    )
  );
}

function chooseWebsite(preferred: Lead, fallback: Lead) {
  if (!preferred.website) return cleanHomepage(fallback.website);
  if (!fallback.website) return cleanHomepage(preferred.website);
  if (isHomepage(preferred.website)) return cleanHomepage(preferred.website);
  if (isHomepage(fallback.website)) return cleanHomepage(fallback.website);
  return cleanHomepage(preferred.website.length <= fallback.website.length ? preferred.website : fallback.website);
}

function mergeLead(current: Lead, candidate: Lead) {
  const preferred = shouldPrefer(candidate, current) ? candidate : current;
  const fallback = preferred === candidate ? current : candidate;
  const internalSources = uniqueSources(current, candidate);

  return {
    ...preferred,
    email: preferred.email || fallback.email,
    phone: preferred.phone || fallback.phone,
    website: chooseWebsite(preferred, fallback),
    address: preferred.address || fallback.address,
    company_name: preferred.company_name || fallback.company_name,
    description: preferred.description || fallback.description,
    city: preferred.city || fallback.city,
    country: preferred.country || fallback.country,
    source: internalSources.join(", "),
    internal_sources: internalSources,
    internal_source_count: internalSources.length,
    scraper_status: preferred.email || fallback.email ? "found" : preferred.scraper_status,
    duplicate_count: (current.duplicate_count || 1) + (candidate.duplicate_count || 1)
  } satisfies Lead;
}

export function dedupeLeads(leads: Lead[]) {
  const deduped: Lead[] = [];
  const domainIndex = new Map<string, number>();

  for (const lead of leads) {
    const internalSources = uniqueSources(lead);
    const candidate = {
      ...lead,
      website: cleanHomepage(lead.website),
      source: internalSources.join(", ") || lead.source,
      internal_sources: internalSources,
      internal_source_count: internalSources.length,
      duplicate_count: lead.duplicate_count || 1
    };
    const domain = websiteDomain(candidate.website);
    let duplicateIndex = domain ? domainIndex.get(domain) : undefined;

    if (duplicateIndex === undefined) {
      duplicateIndex = deduped.findIndex((existing) => areSimilarByCompanyAndCity(existing, candidate));
    }

    if (duplicateIndex === undefined || duplicateIndex < 0) {
      deduped.push(candidate);
      if (domain) domainIndex.set(domain, deduped.length - 1);
      continue;
    }

    deduped[duplicateIndex] = mergeLead(deduped[duplicateIndex], candidate);
    const mergedDomain = websiteDomain(deduped[duplicateIndex].website);
    if (mergedDomain) domainIndex.set(mergedDomain, duplicateIndex);
  }

  return deduped;
}
