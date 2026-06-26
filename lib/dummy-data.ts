export type Lead = {
  id: string;
  company_name: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  source: string;
  scraper_status: "pending" | "found" | "not_found" | "failed";
  duplicate_count: number;
  lead_score: number;
  lead_quality: "High Quality" | "Medium Quality" | "Low Quality";
  description?: string;
  internal_sources?: string[];
  internal_source_count?: number;
  created_at: string;
};

export type SearchRecord = {
  id: string;
  keyword: string;
  country: string;
  city: string;
  industry: string;
  status: "complete" | "running" | "queued";
  created_at: string;
  leads: number;
  credit_cost: number;
};

export const userProfile = {
  email: "founder@zanscope.io",
  plan: "Growth",
  credits: 842
};

export const searches: SearchRecord[] = [
  {
    id: "sea_1049",
    keyword: "AI workflow automation",
    country: "United States",
    city: "Austin",
    industry: "Software",
    status: "complete",
    created_at: "2026-06-05",
    leads: 48,
    credit_cost: 73
  },
  {
    id: "sea_1048",
    keyword: "B2B logistics platform",
    country: "Germany",
    city: "Berlin",
    industry: "Logistics",
    status: "complete",
    created_at: "2026-06-04",
    leads: 31,
    credit_cost: 45
  },
  {
    id: "sea_1047",
    keyword: "Revenue intelligence",
    country: "United Kingdom",
    city: "London",
    industry: "Sales Tech",
    status: "running",
    created_at: "2026-06-04",
    leads: 12,
    credit_cost: 17
  }
];

export const leads: Lead[] = [
  {
    id: "lead_001",
    company_name: "Northstar Automation",
    website: "https://northstar.example",
    email: "partnerships@northstar.example",
    phone: "+1 512 555 0148",
    address: "110 Congress Ave, Austin, TX",
    city: "Austin",
    country: "United States",
    source: "ZanScope Preview",
    scraper_status: "found",
    duplicate_count: 1,
    lead_score: 90,
    lead_quality: "High Quality",
    created_at: "2026-06-05"
  },
  {
    id: "lead_002",
    company_name: "LatticeOps",
    website: "https://latticeops.example",
    email: "hello@latticeops.example",
    phone: "+1 512 555 0199",
    address: "204 W 4th St, Austin, TX",
    city: "Austin",
    country: "United States",
    source: "ZanScope Preview",
    scraper_status: "found",
    duplicate_count: 1,
    lead_score: 90,
    lead_quality: "High Quality",
    created_at: "2026-06-05"
  },
  {
    id: "lead_003",
    company_name: "Clearpath Systems",
    website: "https://clearpath.example",
    email: "sales@clearpath.example",
    phone: "+1 512 555 0182",
    address: "515 Congress Ave, Austin, TX",
    city: "Austin",
    country: "United States",
    source: "ZanScope Preview",
    scraper_status: "found",
    duplicate_count: 1,
    lead_score: 90,
    lead_quality: "High Quality",
    created_at: "2026-06-05"
  },
  {
    id: "lead_004",
    company_name: "SignalForge AI",
    website: "https://signalforge.example",
    email: "growth@signalforge.example",
    phone: "+1 512 555 0135",
    address: "301 Brazos St, Austin, TX",
    city: "Austin",
    country: "United States",
    source: "ZanScope Preview",
    scraper_status: "found",
    duplicate_count: 1,
    lead_score: 90,
    lead_quality: "High Quality",
    created_at: "2026-06-05"
  },
  {
    id: "lead_005",
    company_name: "Brightlane Cloud",
    website: "https://brightlane.example",
    email: "contact@brightlane.example",
    phone: "+1 512 555 0161",
    address: "600 Congress Ave, Austin, TX",
    city: "Austin",
    country: "United States",
    source: "ZanScope Preview",
    scraper_status: "found",
    duplicate_count: 1,
    lead_score: 90,
    lead_quality: "High Quality",
    created_at: "2026-06-05"
  }
];

export function leadsToCsv(rows: Lead[]) {
  const columns: Array<[string, keyof Lead]> = [
    ["company_name", "company_name"],
    ["website", "website"],
    ["email", "email"],
    ["phone", "phone"],
    ["address", "address"],
    ["city", "city"],
    ["country", "country"],
    ["enrichment_status", "scraper_status"],
    ["duplicate_count", "duplicate_count"],
    ["lead_score", "lead_score"],
    ["lead_quality", "lead_quality"],
    ["created_at", "created_at"]
  ];
  const escaped = rows.map((row) =>
    columns
      .map(([, key]) => {
        const value = row[key];
        return `"${String(value).replaceAll('"', '""')}"`;
      })
      .join(",")
  );

  return [columns.map(([header]) => header).join(","), ...escaped].join("\n");
}
