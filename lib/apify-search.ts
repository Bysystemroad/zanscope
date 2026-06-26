import { Lead } from "@/lib/dummy-data";
import { isLikelyCompanyWebsite, normalizeCompanyWebsite } from "@/lib/lead-source-filter";

type SearchPayload = {
  keyword?: string;
  country?: string;
  city?: string;
  industry?: string;
};

type WebSearchItem = {
  title?: string;
  name?: string;
  url?: string;
  link?: string;
  website?: string;
  displayedUrl?: string;
  websiteTitle?: string;
  description?: string;
  snippet?: string;
  phone?: string;
  phoneNumber?: string;
  address?: string;
  organicResults?: WebSearchItem[];
  searchResults?: WebSearchItem[];
  results?: WebSearchItem[];
};

export type ApifySearchResult = {
  leads: Lead[];
  used: boolean;
  error: string | null;
};

const DEFAULT_ACTOR_ID = "apify/google-search-scraper";
const PUBLIC_SOURCE_LABEL = "ZanScope Intelligence";

function actorIdForUrl(actorId: string) {
  return actorId.trim().replace("/", "~");
}

function buildQuery(payload: SearchPayload) {
  return [payload.keyword, payload.industry, payload.city, payload.country]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
}

function normalizeUrl(value?: string) {
  const rawValue = value?.trim();
  if (!rawValue) return "";

  const withProtocol = /^https?:\/\//i.test(rawValue) ? rawValue : `https://${rawValue}`;

  try {
    const url = new URL(withProtocol);
    if (url.hostname.includes("google.")) return "";
    return url.toString();
  } catch {
    return "";
  }
}

function companyNameFromUrl(website: string) {
  try {
    const hostname = new URL(website).hostname.replace(/^www\./, "");
    return hostname.split(".")[0]?.replace(/[-_]+/g, " ") || "";
  } catch {
    return "";
  }
}

function flattenItems(items: WebSearchItem[]) {
  return items.flatMap((item) => {
    const nested = item.organicResults || item.searchResults || item.results;
    return nested?.length ? nested : [item];
  });
}

function toLead(item: WebSearchItem, index: number, payload: SearchPayload): Lead | null {
  const rawWebsite = normalizeUrl(item.url || item.link || item.website || item.displayedUrl);
  const description = item.description || item.snippet || "";

  if (
    !isLikelyCompanyWebsite({
      url: rawWebsite,
      title: item.title || item.name,
      websiteTitle: item.websiteTitle,
      description
    })
  ) {
    return null;
  }

  const website = normalizeCompanyWebsite(rawWebsite);
  const companyName = item.title?.trim() || item.name?.trim() || companyNameFromUrl(website);

  if (!website || !companyName) return null;

  return {
    id: `web_search_${index + 1}_${crypto.randomUUID()}`,
    company_name: companyName || "Unknown company",
    website,
    email: "",
    phone: item.phone || item.phoneNumber || "",
    address: item.address || "",
    city: payload.city || "",
    country: payload.country || "",
    source: PUBLIC_SOURCE_LABEL,
    scraper_status: "pending",
    duplicate_count: 1,
    lead_score: 0,
    lead_quality: "Low Quality",
    description,
    internal_sources: ["Internal discovery engine"],
    internal_source_count: 1,
    created_at: new Date().toISOString()
  };
}

export async function searchApifyGoogle(payload: SearchPayload): Promise<ApifySearchResult> {
  const token = process.env.APIFY_API_TOKEN;
  const query = buildQuery(payload);

  if (!token || !query) {
    return { leads: [], used: false, error: null };
  }

  const actorId = actorIdForUrl(process.env.APIFY_GOOGLE_SEARCH_ACTOR_ID || DEFAULT_ACTOR_ID);
  const maxResults = Number(process.env.APIFY_GOOGLE_SEARCH_MAX_RESULTS || 10);
  const url = new URL(`https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items`);
  url.searchParams.set("token", token);
  url.searchParams.set("clean", "true");
  url.searchParams.set("format", "json");

  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(60_000),
      body: JSON.stringify({
        queries: query,
        maxPagesPerQuery: 1,
        resultsPerPage: Math.min(Math.max(maxResults, 1), 100)
      })
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { leads: [], used: true, error: `Internal discovery engine request failed: ${message}` };
  }

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    return { leads: [], used: true, error: `Internal discovery engine failed (${response.status}): ${message}` };
  }

  try {
    const data = (await response.json()) as WebSearchItem[];
    const leads = flattenItems(Array.isArray(data) ? data : [])
      .map((item, index) => toLead(item, index, payload))
      .filter((lead): lead is Lead => Boolean(lead))
      .slice(0, maxResults);

    return { leads, used: true, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { leads: [], used: true, error: `Internal discovery engine returned invalid JSON: ${message}` };
  }
}
