import Link from "next/link";
import { ArrowUpRight, BarChart3, CheckCircle2, FileUp, ListChecks, Mail, Search, Star, Users, Zap } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardStats, getUserProfile } from "@/lib/supabase/server";

const statItems = [
  ["Total Searches", "totalSearches", Search],
  ["Companies Found", "companiesFound", Users],
  ["Companies Enriched", "companiesEnriched", CheckCircle2],
  ["Emails Found", "emailsFound", Mail],
  ["Credits Used", "creditsUsed", Zap],
  ["Saved Leads", "savedLeads", Users],
  ["Lead Lists", "leadLists", ListChecks],
  ["Average Lead Score", "averageLeadScore", Star]
] as const;

const onboardingSteps = [
  "Create your first search",
  "Review lead scores",
  "Save qualified leads to a list",
  "Export to Excel or CSV"
];

export default async function DashboardPage() {
  const [userProfile, stats] = await Promise.all([getUserProfile(), getDashboardStats()]);
  const showOnboarding = stats.totalSearches === 0 && stats.savedLeads === 0 && stats.enrichmentJobs === 0;

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal text-white">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Welcome back, {userProfile.email}</p>
        </div>
        <Link href="/new-search">
          <Button>
            <Search className="h-4 w-4" />
            New search
          </Button>
        </Link>
      </div>

      {showOnboarding && (
        <div className="glass-panel mb-6 rounded-2xl p-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#d8e0e8]">First steps</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Welcome to Zanscope</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Start by creating your first lead search or uploading a company list for enrichment.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/new-search">
                  <Button>
                    <Search className="h-4 w-4" />
                    Start a Lead Search
                  </Button>
                </Link>
                <Link href="/dashboard/enrich">
                  <Button variant="outline">
                    <FileUp className="h-4 w-4" />
                    Enrich a CSV List
                  </Button>
                </Link>
                <Link href="/help">
                  <Button variant="ghost">
                    <ArrowUpRight className="h-4 w-4" />
                    View Help Center
                  </Button>
                </Link>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <h3 className="font-semibold text-white">How to get started</h3>
              <div className="mt-4 space-y-3">
                {onboardingSteps.map((step) => (
                  <div key={step} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-[#d8e0e8]" />
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statItems.map(([label, key, Icon]) => (
          <Card key={label}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-white">{stats[key].toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="glass-panel mt-6 rounded-2xl">
        <div className="flex items-center justify-between border-b border-white/8 p-5">
          <h2 className="font-semibold text-white">Recent searches</h2>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="divide-y divide-white/10">
          {stats.recentSearches.length === 0 ? (
            <div className="p-5 text-sm text-muted-foreground">No searches yet.</div>
          ) : (
            stats.recentSearches.map((search) => (
              <Link key={search.id} href={`/search/results?searchId=${search.id}`} className="grid gap-3 p-5 transition hover:bg-white/5 md:grid-cols-[1fr_140px_90px]">
                <div>
                  <div className="font-medium text-white">{search.keyword}</div>
                  <div className="text-sm text-muted-foreground">{search.city}, {search.country} / {search.industry}</div>
                </div>
                <div className="text-sm text-muted-foreground">{search.credit_cost} credits</div>
                <div className="flex items-center gap-2 text-sm font-medium text-[#d8e0e8]">
                  Open <ArrowUpRight className="h-4 w-4" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
