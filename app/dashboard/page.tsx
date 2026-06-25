import Link from "next/link";
import { ArrowUpRight, Search, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { searches } from "@/lib/dummy-data";
import { getUserProfile } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const userProfile = await getUserProfile();

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal text-white">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Welcome back, {userProfile.email}</p>
        </div>
        <Link href="/search/new">
          <Button>
            <Search className="h-4 w-4" />
            New search
          </Button>
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Credits</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold text-white">{userProfile.credits}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Searches</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold text-white">{searches.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Leads found</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold text-white">91</div></CardContent>
        </Card>
      </div>
      <div className="glass-panel mt-6 rounded-2xl">
        <div className="flex items-center justify-between border-b border-white/8 p-5">
          <h2 className="font-semibold text-white">Recent searches</h2>
          <Users className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="divide-y divide-white/10">
          {searches.map((search) => (
            <Link key={search.id} href={`/search/results?searchId=${search.id}`} className="grid gap-3 p-5 transition hover:bg-white/5 md:grid-cols-[1fr_120px_90px]">
              <div>
                <div className="font-medium text-white">{search.keyword}</div>
                <div className="text-sm text-muted-foreground">{search.city}, {search.country} / {search.industry}</div>
              </div>
              <div className="text-sm text-muted-foreground">{search.leads} leads</div>
              <div className="flex items-center gap-2 text-sm font-medium text-[#d8e0e8]">
                Open <ArrowUpRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

