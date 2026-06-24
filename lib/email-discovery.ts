import { Lead } from "@/lib/dummy-data";

const DISCOVERY_PATHS = ["", "/contact", "/contacts", "/contact-us", "/about", "/impressum"];
const REQUEST_TIMEOUT_MS = 5000;
const MAX_HTML_CHARS = 700000;
const BULK_CONCURRENCY = 3;

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const FAKE_EMAIL_PARTS = [
  "example.com",
  "example.org",
  "example.net",
  "domain.com",
  "email.com",
  "yourdomain",
  "sentry.io",
  "wixpress.com",
  "schema.org",
  "test@",
  "fake@",
  "name@",
  "user@",
  "you@",
  "email@",
  "mail@example",
  "noreply@",
  "no-reply@",
  "donotreply@"
];

const EMAIL_FILE_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".webp",
  ".css",
  ".js",
  ".json",
  ".ico"
];

type ScrapeResult = {
  email: string;
  scraper_status: Lead["scraper_status"];
};

function normalizeWebsite(website: string) {
  const trimmed = website.trim();
  if (!trimmed) return null;

  try {
    return new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
}

function buildDiscoveryUrls(website: string) {
  const baseUrl = normalizeWebsite(website);
  if (!baseUrl) return [];

  return DISCOVERY_PATHS.map((path) => {
    const url = new URL(baseUrl.origin);
    url.pathname = path;
    return url.toString();
  });
}

async function fetchWithTimeout(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "ZanScopeLeadDiscovery/1.0",
        Accept: "text/html,text/plain"
      }
    });

    if (!response.ok) return "";

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) return "";

    const html = await response.text();
    return html.slice(0, MAX_HTML_CHARS);
  } finally {
    clearTimeout(timeout);
  }
}

function decodeEmailText(html: string) {
  return html
    .replaceAll("&#64;", "@")
    .replaceAll("&commat;", "@")
    .replaceAll("%40", "@")
    .replace(/\s*\[at\]\s*/gi, "@")
    .replace(/\s*\(at\)\s*/gi, "@")
    .replace(/\s+at\s+/gi, "@")
    .replace(/\s*\[dot\]\s*/gi, ".")
    .replace(/\s*\(dot\)\s*/gi, ".")
    .replace(/\s+dot\s+/gi, ".");
}

function isUsableEmail(email: string) {
  const normalized = email.toLowerCase();
  const [localPart] = normalized.split("@");

  if (FAKE_EMAIL_PARTS.some((part) => normalized.includes(part))) return false;
  if (EMAIL_FILE_EXTENSIONS.some((extension) => normalized.endsWith(extension))) return false;
  if (!localPart || localPart.length < 3) return false;
  if (normalized.includes("@2x.") || normalized.includes("@3x.")) return false;

  return true;
}

function extractEmails(html: string) {
  const decoded = decodeEmailText(html);
  const matches = decoded.match(EMAIL_REGEX) || [];
  return [...new Set(matches.map((email) => email.toLowerCase()))].filter(isUsableEmail);
}

export async function discoverWebsiteEmail(website: string): Promise<ScrapeResult> {
  const urls = buildDiscoveryUrls(website);
  if (urls.length === 0) {
    return { email: "", scraper_status: "failed" };
  }

  let visitedAnyPage = false;

  for (const url of urls) {
    try {
      const html = await fetchWithTimeout(url);
      if (!html) continue;

      visitedAnyPage = true;
      const emails = extractEmails(html);
      if (emails[0]) {
        return { email: emails[0], scraper_status: "found" };
      }
    } catch {
      continue;
    }
  }

  return { email: "", scraper_status: visitedAnyPage ? "not_found" : "failed" };
}

export async function discoverEmailsForLeads(leads: Lead[], concurrency = BULK_CONCURRENCY) {
  const enrichedLeads = [...leads];
  let cursor = 0;

  async function worker() {
    while (cursor < enrichedLeads.length) {
      const index = cursor;
      cursor += 1;

      const lead = enrichedLeads[index];
      if (lead.email) {
        enrichedLeads[index] = { ...lead, scraper_status: "found" };
        continue;
      }

      if (!lead.website) {
        enrichedLeads[index] = { ...lead, email: "", scraper_status: "failed" };
        continue;
      }

      const result = await discoverWebsiteEmail(lead.website);
      enrichedLeads[index] = {
        ...lead,
        email: result.email || lead.email,
        scraper_status: result.email || lead.email ? "found" : result.scraper_status
      };
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, enrichedLeads.length) }, worker));
  return enrichedLeads;
}
