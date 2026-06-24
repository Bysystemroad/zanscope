type LeadSourceCandidate = {
  url?: string;
  title?: string;
  websiteTitle?: string;
  description?: string;
};

const BLOCKED_TERMS = [
  "blog",
  "news",
  "article",
  "magazine",
  "forum",
  "directory",
  "yellowpages",
  "yelp",
  "tripadvisor",
  "wikipedia",
  "facebook",
  "instagram",
  "linkedin",
  "youtube",
  "pinterest",
  "reddit",
  "pdf",
  ".pdf",
  "guide",
  "how to",
  "top 10",
  "best of",
  "review",
  "reviews"
];

const COMPANY_SIGNALS = [
  "manufacturer",
  "supplier",
  "distributor",
  "producer",
  "factory",
  "industrial",
  "company",
  "equipment",
  "automation",
  "windows",
  "doors",
  "services",
  "solutions",
  "products"
];

const BLOCKED_HOST_PARTS = [
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
  "made-in-china.",
  "indiamart.",
  "europages.",
  "kompass.",
  "thomasnet."
];

const BLOCKED_PATH_PARTS = [
  "/blog",
  "/blogs",
  "/news",
  "/article",
  "/articles",
  "/magazine",
  "/forum",
  "/forums",
  "/directory",
  "/directories",
  "/review",
  "/reviews",
  "/guide",
  "/guides",
  "/how-to",
  "/top-10",
  "/best-of"
];

function compactText(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ").toLowerCase();
}

function hasBlockedTerm(value: string) {
  return BLOCKED_TERMS.some((term) => value.includes(term));
}

function hasCompanySignal(value: string) {
  return COMPANY_SIGNALS.some((term) => value.includes(term));
}

function parseUrl(value?: string) {
  const rawValue = value?.trim();
  if (!rawValue) return null;

  const withProtocol = /^https?:\/\//i.test(rawValue) ? rawValue : `https://${rawValue}`;

  try {
    return new URL(withProtocol);
  } catch {
    return null;
  }
}

function isBlockedHost(hostname: string) {
  return BLOCKED_HOST_PARTS.some((part) => hostname.includes(part));
}

function isBlockedPath(pathname: string) {
  const normalizedPath = pathname.toLowerCase();
  return BLOCKED_PATH_PARTS.some((part) => normalizedPath.includes(part)) || normalizedPath.endsWith(".pdf");
}

export function normalizeCompanyWebsite(value?: string) {
  const url = parseUrl(value);
  if (!url) return "";

  url.protocol = "https:";
  url.username = "";
  url.password = "";
  url.hash = "";
  url.search = "";
  url.pathname = "/";

  return url.toString();
}

export function isLikelyCompanyWebsite(candidate: LeadSourceCandidate) {
  const url = parseUrl(candidate.url);
  if (!url) return false;

  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  const pathname = url.pathname.toLowerCase();
  const combinedText = compactText(candidate.url, candidate.title, candidate.websiteTitle, candidate.description);

  if (isBlockedHost(hostname)) return false;
  if (isBlockedPath(pathname)) return false;
  if (hasBlockedTerm(combinedText)) return false;
  if (hostname.includes("google.")) return false;

  return hasCompanySignal(combinedText) || pathname === "/" || pathname === "";
}
