import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { Lead, leads as demoLeads, searches as demoSearches, SearchRecord } from "@/lib/dummy-data";
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

type SupabaseLeadListRow = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
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
    return {
      email: profile.email,
      plan: profile.plan,
      credits: profile.credits,
      demoMode: false
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      email: user.email || "",
      plan: "Profile error",
      credits: 0,
      demoMode: false,
      error: message
    };
  }
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

export async function getSavedLeads() {
  if (!isServerSupabaseConfigured()) {
    return { demoMode: true, leads: sortLeadsByScore(demoLeads) };
  }

  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { demoMode: true, leads: sortLeadsByScore(demoLeads) };
  }

  const { data: rows } = await supabase.from("leads").select("*").eq("user_id", user.id).order("created_at", {
    ascending: false
  });

  return { demoMode: false, leads: sortLeadsByScore(((rows || []) as SupabaseLeadRow[]).map(normalizeLead)) };
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
