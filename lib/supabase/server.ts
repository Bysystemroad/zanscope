import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { Lead, leads as demoLeads, searches as demoSearches, SearchRecord } from "@/lib/dummy-data";
import { authTrace } from "@/lib/auth-trace";
import { ensureUserProfile } from "@/lib/supabase/profile";

export type SearchHistoryRecord = SearchRecord & {
  lead_count: number;
  credit_cost: number;
};

export type LeadListRecord = {
  id: string;
  name: string;
  description: string;
  lead_count: number;
  created_at: string;
  updated_at: string;
};

export type UserProfileRecord = {
  email: string;
  plan: string;
  credits: number;
  demoMode: boolean;
  error?: string;
};

type SupabaseLeadRow = Lead & {
  search_id?: string;
};

type SupabaseSearchRow = {
  id: string;
  keyword: string;
  country: string | null;
  city: string | null;
  industry: string | null;
  status: "complete" | "running" | "queued";
  credit_cost: number | null;
  created_at: string;
};

export type SavedLeadsFilters = {
  page?: number;
  pageSize?: number;
  country?: string;
  city?: string;
  emailFound?: string;
  scraperStatus?: string;
  quality?: string;
};

export type SavedLeadsResult = {
  demoMode: boolean;
  leads: Lead[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  filters: Required<Omit<SavedLeadsFilters, "page" | "pageSize">>;
};

type SupabaseLeadListRow = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type DashboardStats = {
  totalSearches: number;
  companiesFound: number;
  companiesEnriched: number;
  emailsFound: number;
  creditsUsed: number;
  savedLeads: number;
  leadLists: number;
  averageLeadScore: number;
  enrichmentJobs: number;
  recentSearches: SearchHistoryRecord[];
};

export function isServerSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function demoHistory(): SearchHistoryRecord[] {
  return demoSearches.map((search) => ({
    ...search,
    lead_count: search.leads,
    credit_cost: search.credit_cost
  }));
}

export async function getUserProfile(): Promise<UserProfileRecord> {
  if (!isServerSupabaseConfigured()) {
    return {
      email: "Demo workspace",
      plan: "Demo",
      credits: 0,
      demoMode: true
    };
  }

  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user }
  } = await supabase.auth.getUser();

  authTrace("server.get_user_profile.auth_result", {
    hasUser: Boolean(user),
    userId: user?.id || null
  });

  if (!user) {
    return {
      email: "Demo workspace",
      plan: "Demo",
      credits: 0,
      demoMode: true
    };
  }

  try {
    const profile = await ensureUserProfile(supabase, user);
    authTrace("server.get_user_profile.profile_result", {
      userId: user.id,
      profileFound: true,
      error: null
    });
    return {
      email: profile.email,
      plan: profile.plan,
      credits: profile.credits,
      demoMode: false
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    authTrace("server.get_user_profile.profile_result", {
      userId: user.id,
      profileFound: false,
      error: message
    });
    return {
      email: user.email || "",
      plan: "Profile error",
      credits: 0,
      demoMode: false,
      error: message
    };
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const emptyStats: DashboardStats = {
    totalSearches: 0,
    companiesFound: 0,
    companiesEnriched: 0,
    emailsFound: 0,
    creditsUsed: 0,
    savedLeads: 0,
    leadLists: 0,
    averageLeadScore: 0,
    enrichmentJobs: 0,
    recentSearches: []
  };

  if (!isServerSupabaseConfigured()) {
    return emptyStats;
  }

  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return emptyStats;
  }

  const [
    searchesResult,
    recentSearchesResult,
    leadsCountResult,
    enrichedCountResult,
    emailCountResult,
    leadScoreResult,
    transactionsResult,
    leadListsResult,
    enrichmentJobsResult
  ] = await Promise.all([
    supabase.from("searches").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase
      .from("searches")
      .select("id, keyword, country, city, industry, status, credit_cost, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("scraper_status", "found"),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("user_id", user.id).neq("email", ""),
    supabase.from("leads").select("lead_score").eq("user_id", user.id).not("lead_score", "is", null),
    supabase.from("credit_transactions").select("amount").eq("user_id", user.id).lt("amount", 0),
    supabase.from("lead_lists").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("enrichment_jobs").select("id", { count: "exact", head: true }).eq("user_id", user.id)
  ]);

  const leadScores = (leadScoreResult.data || []) as Array<{ lead_score?: number | null }>;
  const transactions = (transactionsResult.data || []) as Array<{ amount?: number | null }>;
  const recentRows = (recentSearchesResult.data || []) as SupabaseSearchRow[];
  const companiesFound = leadsCountResult.count || 0;
  const scoredLeads = leadScores.filter((lead) => typeof lead.lead_score === "number");

  return {
    totalSearches: searchesResult.count || 0,
    companiesFound,
    companiesEnriched: enrichedCountResult.count || 0,
    emailsFound: emailCountResult.count || 0,
    creditsUsed: Math.abs(
      transactions
        .reduce((sum, transaction) => sum + (transaction.amount || 0), 0)
    ),
    savedLeads: companiesFound,
    leadLists: leadListsResult.count || 0,
    averageLeadScore: scoredLeads.length
      ? Math.round(scoredLeads.reduce((sum, lead) => sum + (lead.lead_score || 0), 0) / scoredLeads.length)
      : 0,
    enrichmentJobs: enrichmentJobsResult.count || 0,
    recentSearches: recentRows.map((search) => ({
      id: search.id,
      keyword: search.keyword,
      country: search.country || "",
      city: search.city || "",
      industry: search.industry || "",
      status: search.status,
      created_at: search.created_at,
      leads: 0,
      lead_count: 0,
      credit_cost: search.credit_cost || 0
    }))
  };
}

function demoLeadLists(): LeadListRecord[] {
  return [
    {
      id: "list_demo_italy",
      name: "Italy Window Manufacturers",
      description: "Demo list for regional building materials leads.",
      lead_count: demoLeads.length,
      created_at: "2026-06-05",
      updated_at: "2026-06-05"
    },
    {
      id: "list_demo_germany",
      name: "German Automation Companies",
      description: "Demo list for industrial automation prospects.",
      lead_count: 0,
      created_at: "2026-06-04",
      updated_at: "2026-06-04"
    }
  ];
}

function normalizeLead(row: Partial<SupabaseLeadRow>): Lead {
  return {
    id: row.id || crypto.randomUUID(),
    company_name: row.company_name || "",
    website: row.website || "",
    email: row.email || "",
    phone: row.phone || "",
    address: row.address || "",
    city: row.city || "",
    country: row.country || "",
    source: row.source || "",
    scraper_status: row.scraper_status || "pending",
    duplicate_count: row.duplicate_count || 1,
    lead_score: row.lead_score || 0,
    lead_quality: row.lead_quality || "Low Quality",
    created_at: row.created_at || new Date().toISOString()
  };
}

function sortLeadsByScore(leads: Lead[]) {
  return [...leads].sort((a, b) => {
    if (b.lead_score !== a.lead_score) return b.lead_score - a.lead_score;
    return Date.parse(b.created_at) - Date.parse(a.created_at);
  });
}

function normalizePage(value?: number) {
  return Number.isFinite(value) && value && value > 0 ? Math.floor(value) : 1;
}

function normalizePageSize(value?: number) {
  if (!Number.isFinite(value) || !value) return 50;
  return Math.min(Math.max(Math.floor(value), 1), 100);
}

function normalizeSavedLeadFilters(filters: SavedLeadsFilters = {}) {
  return {
    country: filters.country?.trim() || "",
    city: filters.city?.trim() || "",
    emailFound: filters.emailFound === "yes" || filters.emailFound === "no" ? filters.emailFound : "",
    scraperStatus: filters.scraperStatus?.trim() || "",
    quality: filters.quality?.trim() || ""
  };
}

function calculateStoredCost(leads: Lead[], storedCost?: number | null) {
  if (storedCost && storedCost > 0) return storedCost;
  return leads.length + leads.filter((lead) => Boolean(lead.email)).length;
}

export async function getSearchHistory() {
  if (!isServerSupabaseConfigured()) {
    return { demoMode: true, searches: demoHistory() };
  }

  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { demoMode: true, searches: demoHistory() };
  }

  const { data: searches } = await supabase
    .from("searches")
    .select("id, keyword, country, city, industry, status, credit_cost, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const rows = (searches || []) as SupabaseSearchRow[];
  const history = await Promise.all(
    rows.map(async (search) => {
      const { data: leads } = await supabase.from("leads").select("email").eq("search_id", search.id);
      const emailCount = (leads || []).filter((lead) => Boolean(lead.email)).length;
      const leadCount = leads?.length || 0;

      return {
        id: search.id,
        keyword: search.keyword,
        country: search.country || "",
        city: search.city || "",
        industry: search.industry || "",
        status: search.status,
        created_at: search.created_at,
        leads: leadCount,
        lead_count: leadCount,
        credit_cost: search.credit_cost && search.credit_cost > 0 ? search.credit_cost : leadCount + emailCount
      };
    })
  );

  return { demoMode: false, searches: history };
}

export async function getSavedLeads(filters: SavedLeadsFilters = {}): Promise<SavedLeadsResult> {
  const page = normalizePage(filters.page);
  const pageSize = normalizePageSize(filters.pageSize);
  const normalizedFilters = normalizeSavedLeadFilters(filters);
  const demoRows = sortLeadsByScore(demoLeads);

  if (!isServerSupabaseConfigured()) {
    return {
      demoMode: true,
      leads: demoRows.slice((page - 1) * pageSize, page * pageSize),
      page,
      pageSize,
      total: demoRows.length,
      totalPages: Math.max(1, Math.ceil(demoRows.length / pageSize)),
      filters: normalizedFilters
    };
  }

  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      demoMode: true,
      leads: demoRows.slice((page - 1) * pageSize, page * pageSize),
      page,
      pageSize,
      total: demoRows.length,
      totalPages: Math.max(1, Math.ceil(demoRows.length / pageSize)),
      filters: normalizedFilters
    };
  }

  let query = supabase
    .from("leads")
    .select(
      "id, company_name, website, email, phone, address, city, country, source, scraper_status, duplicate_count, lead_score, lead_quality, created_at",
      { count: "exact" }
    )
    .eq("user_id", user.id);

  if (normalizedFilters.country) query = query.eq("country", normalizedFilters.country);
  if (normalizedFilters.city) query = query.eq("city", normalizedFilters.city);
  if (normalizedFilters.scraperStatus) query = query.eq("scraper_status", normalizedFilters.scraperStatus);
  if (normalizedFilters.quality) query = query.eq("lead_quality", normalizedFilters.quality);
  if (normalizedFilters.emailFound === "yes") query = query.neq("email", "");
  if (normalizedFilters.emailFound === "no") query = query.or("email.is.null,email.eq.");

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data: rows, count } = await query
    .order("lead_score", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);
  const total = count || 0;

  return {
    demoMode: false,
    leads: ((rows || []) as SupabaseLeadRow[]).map(normalizeLead),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    filters: normalizedFilters
  };
}

export async function getSavedSearchResults(searchId?: string) {
  if (!searchId || !isServerSupabaseConfigured()) {
    return { demoMode: true, search: undefined, leads: sortLeadsByScore(demoLeads) };
  }

  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { demoMode: true, search: undefined, leads: sortLeadsByScore(demoLeads) };
  }

  const { data: search } = await supabase
    .from("searches")
    .select("id, keyword, country, city, industry, status, credit_cost, created_at")
    .eq("id", searchId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!search) {
    return { demoMode: false, search: undefined, leads: [] };
  }

  const { data: rows } = await supabase.from("leads").select("*").eq("search_id", search.id).order("created_at", {
    ascending: false
  });

  const savedLeads = sortLeadsByScore(((rows || []) as SupabaseLeadRow[]).map(normalizeLead));
  return {
    demoMode: false,
    search: {
      id: search.id,
      keyword: search.keyword,
      country: search.country || "",
      city: search.city || "",
      industry: search.industry || "",
      status: search.status,
      created_at: search.created_at,
      leads: savedLeads.length,
      lead_count: savedLeads.length,
      credit_cost: calculateStoredCost(savedLeads, search.credit_cost)
    },
    leads: savedLeads
  };
}

export async function getLeadLists() {
  if (!isServerSupabaseConfigured()) {
    return { demoMode: true, lists: demoLeadLists() };
  }

  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { demoMode: true, lists: demoLeadLists() };
  }

  const { data: lists } = await supabase
    .from("lead_lists")
    .select("id, name, description, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const rows = (lists || []) as SupabaseLeadListRow[];
  const listRecords = await Promise.all(
    rows.map(async (list) => {
      const { count } = await supabase
        .from("lead_list_items")
        .select("id", { count: "exact", head: true })
        .eq("list_id", list.id)
        .eq("user_id", user.id);

      return {
        id: list.id,
        name: list.name,
        description: list.description || "",
        lead_count: count || 0,
        created_at: list.created_at,
        updated_at: list.updated_at
      };
    })
  );

  return { demoMode: false, lists: listRecords };
}

export async function getLeadListDetail(listId?: string) {
  if (!listId || !isServerSupabaseConfigured()) {
    return { demoMode: true, list: demoLeadLists()[0], leads: sortLeadsByScore(demoLeads) };
  }

  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { demoMode: true, list: demoLeadLists()[0], leads: sortLeadsByScore(demoLeads) };
  }

  const { data: list } = await supabase
    .from("lead_lists")
    .select("id, name, description, created_at, updated_at")
    .eq("id", listId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!list) {
    return { demoMode: false, list: undefined, leads: [] };
  }

  const { data: items } = await supabase
    .from("lead_list_items")
    .select("lead_id")
    .eq("list_id", list.id)
    .eq("user_id", user.id);
  const leadIds = (items || []).map((item) => item.lead_id);

  if (leadIds.length === 0) {
    return {
      demoMode: false,
      list: {
        id: list.id,
        name: list.name,
        description: list.description || "",
        lead_count: 0,
        created_at: list.created_at,
        updated_at: list.updated_at
      },
      leads: []
    };
  }

  const { data: rows } = await supabase.from("leads").select("*").in("id", leadIds);
  const savedLeads = sortLeadsByScore(((rows || []) as SupabaseLeadRow[]).map(normalizeLead));

  return {
    demoMode: false,
    list: {
      id: list.id,
      name: list.name,
      description: list.description || "",
      lead_count: savedLeads.length,
      created_at: list.created_at,
      updated_at: list.updated_at
    },
    leads: savedLeads
  };
}
