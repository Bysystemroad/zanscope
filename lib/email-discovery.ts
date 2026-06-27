import { Lead } from "@/lib/dummy-data";

const DISCOVERY_PATHS = [
  "",
  "/contact",
  "/contacts",
  "/contact-us",
  "/about",
  "/about-us",
  "/company",
  "/team",
  "/legal",
  "/privacy",
  "/impressum",
  "/terms",
  "/contatti",
  "/contatto",
  "/chi-siamo",
  "/azienda",
  "/societa",
  "/privacy-policy",
  "/note-legali",
  "/kontakt",
  "/unternehmen",
  "/uber-uns",
  "/datenschutz",
  "/rechtliches",
  "/nous-contacter",
  "/a-propos",
  "/notre-equipe",
  "/entreprise",
  "/societe",
  "/mentions-legales",
  "/confidentialite",
  "/politique-de-confidentialite",
  "/contacto",
  "/quienes-somos",
  "/empresa",
  "/nosotros",
  "/aviso-legal",
  "/privacidad",
  "/politica-de-privacidad"
];

const REQUEST_TIMEOUT_MS = 5000;
const MAX_HTML_CHARS = 700000;
const BULK_CONCURRENCY = 3;
const MAX_PAGES_PER_COMPANY = 28;

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\+|00)?(?:[\d][\s()./-]?){7,18}\d/g;
const MAILTO_REGEX = /mailto:([^"'?#\s>]+)/gi;
const HREF_REGEX = /href=["']([^"']+)["']/gi;
const LINKEDIN_REGEX = /https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/company\/[a-zA-Z0-9_.%-]+\/?/gi;
const ADDRESS_HINT_REGEX =
  /(?:address|adresse|indirizzo|anschrift|sede|registered office|headquarters|adresse du siege)[\s\S]{0,360}/gi;

const HIGH_PRIORITY_PREFIXES = [
  "sales",
  "commercial",
  "commerciale",
  "export",
  "business",
  "b2b",
  "marketing",
  "info",
  "contact",
  "office",
  "hello"
];

const MEDIUM_PRIORITY_PREFIXES = ["service", "support", "customer", "help"];
const LOW_PRIORITY_PREFIXES = ["admin", "web", "hr", "careers", "career", "jobs"];
const BAD_PREFIXES = ["noreply", "no-reply", "privacy", "gdpr", "legal", "webmaster", "postmaster", "example", "test", "demo"];

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

const IGNORED_FILE_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".webp",
  ".css",
  ".js",
  ".json",
  ".ico",
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".zip",
  ".rar"
];

type ScrapeResult = {
  email: string;
  phone: string;
  address: string;
  linkedin_url: string;
  scraper_status: Lead["scraper_status"];
  secondary_emails: string[];
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

function isDownloadUrl(url: URL) {
  const pathname = url.pathname.toLowerCase();
  return IGNORED_FILE_EXTENSIONS.some((extension) => pathname.endsWith(extension));
}

function buildDiscoveryUrls(website: string) {
  const baseUrl = normalizeWebsite(website);
  if (!baseUrl) return [];

  const urls = new Map<string, string>();

  for (const path of DISCOVERY_PATHS) {
    const url = new URL(baseUrl.origin);
    url.pathname = path;
    if (!isDownloadUrl(url)) urls.set(url.toString(), url.toString());
  }

  return [...urls.values()].slice(0, MAX_PAGES_PER_COMPANY);
}

async function fetchWithTimeout(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "ZanscopeLeadDiscovery/1.0",
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

function htmlDecode(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&#64;|&commat;/gi, "@")
    .replace(/&#46;|&period;/gi, ".")
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function stripTags(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

function decodeEmailText(html: string) {
  return htmlDecode(html)
    .replaceAll("%40", "@")
    .replace(/\s*\[at\]\s*/gi, "@")
    .replace(/\s*\(at\)\s*/gi, "@")
    .replace(/\s+at\s+/gi, "@")
    .replace(/\s*\[@\]\s*/gi, "@")
    .replace(/\s*@\s*/g, "@")
    .replace(/\s*\[dot\]\s*/gi, ".")
    .replace(/\s*\(dot\)\s*/gi, ".")
    .replace(/\s+dot\s+/gi, ".")
    .replace(/\s*\[\.\]\s*/gi, ".")
    .replace(/\s*\.\s*/g, ".");
}

function isUsableEmail(email: string) {
  const normalized = email.toLowerCase();
  const [localPart, domain = ""] = normalized.split("@");

  if (!domain.includes(".")) return false;
  if (FAKE_EMAIL_PARTS.some((part) => normalized.includes(part))) return false;
  if (IGNORED_FILE_EXTENSIONS.some((extension) => normalized.endsWith(extension))) return false;
  if (!localPart || localPart.length < 2) return false;
  if (normalized.includes("@2x.") || normalized.includes("@3x.")) return false;

  return true;
}

function emailScore(email: string, websiteDomain: string) {
  const normalized = email.toLowerCase();
  const [localPart, domain = ""] = normalized.split("@");
  const prefix = localPart.split(/[.+_-]/)[0];
  let score = 30;

  if (websiteDomain && domain.endsWith(websiteDomain)) score += 30;
  if (HIGH_PRIORITY_PREFIXES.includes(prefix)) score += 45;
  else if (MEDIUM_PRIORITY_PREFIXES.includes(prefix)) score += 20;
  else if (LOW_PRIORITY_PREFIXES.includes(prefix)) score -= 10;
  if (BAD_PREFIXES.includes(prefix) || BAD_PREFIXES.some((bad) => localPart.includes(bad))) score -= 80;
  if (localPart.length > 32) score -= 10;

  return score;
}

function websiteDomain(website: string) {
  const url = normalizeWebsite(website);
  return url?.hostname.toLowerCase().replace(/^www\./, "") || "";
}

function extractMailtoEmails(html: string) {
  return [...html.matchAll(MAILTO_REGEX)].map((match) => decodeURIComponent(match[1] || "").split("?")[0]);
}

function extractEmails(html: string, website: string) {
  const decoded = decodeEmailText(`${html} ${stripTags(html)}`);
  const matches = [...extractMailtoEmails(html), ...(decoded.match(EMAIL_REGEX) || [])];
  const domain = websiteDomain(website);
  const uniqueEmails = [...new Set(matches.map((email) => email.toLowerCase().trim()))].filter(isUsableEmail);

  return uniqueEmails.sort((a, b) => emailScore(b, domain) - emailScore(a, domain));
}

function normalizePhone(value: string) {
  const clean = value.replace(/[^\d+]/g, "");
  if (clean.length < 8 || clean.length > 18) return "";
  if (/^0+$/.test(clean.replace("+", ""))) return "";
  return value.replace(/\s+/g, " ").trim();
}

function extractPhones(html: string) {
  const telLinks = [...html.matchAll(/href=["']tel:([^"']+)["']/gi)].map((match) => decodeURIComponent(match[1] || ""));
  const whatsappLinks = [...html.matchAll(/(?:wa\.me\/|api\.whatsapp\.com\/send\?phone=)(\+?\d+)/gi)].map((match) => match[1] || "");
  const visibleMatches = (stripTags(html).match(PHONE_REGEX) || []).slice(0, 30);

  return [...new Set([...telLinks, ...whatsappLinks, ...visibleMatches].map(normalizePhone).filter(Boolean))];
}

function cleanAddressCandidate(value: string) {
  return stripTags(htmlDecode(value))
    .replace(/\s+/g, " ")
    .replace(/\b(email|phone|tel|fax|vat|piva|ust-id|siret)\b.*$/i, "")
    .trim()
    .slice(0, 220);
}

function extractStructuredAddresses(html: string) {
  const matches = [...html.matchAll(/"streetAddress"\s*:\s*"([^"]+)"[\s\S]{0,260}?"addressLocality"\s*:\s*"([^"]+)"/gi)];
  return matches.map((match) => cleanAddressCandidate(`${match[1]}, ${match[2]}`));
}

function extractAddresses(html: string) {
  const structured = extractStructuredAddresses(html);
  const hinted = [...html.matchAll(ADDRESS_HINT_REGEX)].map((match) => cleanAddressCandidate(match[0]));
  return [...structured, ...hinted].filter((address) => address.length >= 18 && /\d/.test(address));
}

function normalizeLinkedInUrl(value: string) {
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    const path = url.pathname.toLowerCase();

    if (!url.hostname.toLowerCase().includes("linkedin.com")) return "";
    if (!path.startsWith("/company/")) return "";
    if (path.includes("/in/") || path.includes("/pub/") || path.includes("/profile/")) return "";
    if (path.includes("/sharearticle") || path.includes("/login") || path.includes("/search") || path.includes("/feed")) return "";

    url.protocol = "https:";
    url.hostname = "www.linkedin.com";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

function extractLinkedInUrls(html: string) {
  const direct = html.match(LINKEDIN_REGEX) || [];
  const hrefs = [...html.matchAll(HREF_REGEX)].map((match) => htmlDecode(match[1] || ""));
  return [...new Set([...direct, ...hrefs].map(normalizeLinkedInUrl).filter(Boolean))];
}

export async function discoverWebsiteEmail(website: string): Promise<ScrapeResult> {
  const urls = buildDiscoveryUrls(website);
  if (urls.length === 0) {
    return { email: "", phone: "", address: "", linkedin_url: "", secondary_emails: [], scraper_status: "failed" };
  }

  let visitedAnyPage = false;
  const emails = new Set<string>();
  const phones = new Set<string>();
  const addresses = new Set<string>();
  const linkedInUrls = new Set<string>();

  for (const url of urls) {
    try {
      const html = await fetchWithTimeout(url);
      if (!html) continue;

      visitedAnyPage = true;
      extractEmails(html, website).forEach((email) => emails.add(email));
      extractPhones(html).forEach((phone) => phones.add(phone));
      extractAddresses(html).forEach((address) => addresses.add(address));
      extractLinkedInUrls(html).forEach((linkedinUrl) => linkedInUrls.add(linkedinUrl));
    } catch {
      continue;
    }
  }

  const rankedEmails = [...emails].sort((a, b) => emailScore(b, websiteDomain(website)) - emailScore(a, websiteDomain(website)));
  const email = rankedEmails[0] || "";

  return {
    email,
    phone: [...phones][0] || "",
    address: [...addresses][0] || "",
    linkedin_url: [...linkedInUrls][0] || "",
    secondary_emails: rankedEmails.slice(1, 6),
    scraper_status: email || phones.size > 0 || addresses.size > 0 || linkedInUrls.size > 0 ? "found" : visitedAnyPage ? "not_found" : "failed"
  };
}

export async function discoverEmailsForLeads(leads: Lead[], concurrency = BULK_CONCURRENCY) {
  const enrichedLeads = [...leads];
  let cursor = 0;

  async function worker() {
    while (cursor < enrichedLeads.length) {
      const index = cursor;
      cursor += 1;

      const lead = enrichedLeads[index];

      if (!lead.website) {
        enrichedLeads[index] = { ...lead, scraper_status: lead.email ? "found" : "failed" };
        continue;
      }

      const result = await discoverWebsiteEmail(lead.website);
      const email = lead.email || result.email;
      const phone = lead.phone || result.phone;
      const address = lead.address || result.address;
      const linkedinUrl = lead.linkedin_url || result.linkedin_url;

      enrichedLeads[index] = {
        ...lead,
        email,
        phone,
        address,
        linkedin_url: linkedinUrl,
        scraper_status: email || phone || address || linkedinUrl ? "found" : result.scraper_status
      };
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, enrichedLeads.length) }, worker));
  return enrichedLeads;
}
