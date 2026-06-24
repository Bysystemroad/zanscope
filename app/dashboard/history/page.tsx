import Link from "next/link";
import { ArrowUpRight, Clock3 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getSearchHistory } from "@/lib/supabase/server";

export default async function SearchHistoryPage() {
  const { searches, demoMode } = await getSearchHistory();

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-normal text-white">Search history</h1>
        <p className="text-muted-foreground">
          {demoMode ? "Demo searches are shown until Supabase auth is connected." : "Saved searches from your workspace."}
        </p>
      </div>
      <div className="glass-panel overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-white/8 p-5">
          <h2 className="font-semibold text-white">Previous searches</h2>
          <Clock3 className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="bg-white/6 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Keyword</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Leads</th>
                <th className="px-4 py-3">Credit cost</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Open</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {searches.map((search) => (
                <tr key={search.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 font-medium text-white">{search.keyword}</td>
                  <td className="px-4 py-3">{search.city || "-"}</td>
                  <td className="px-4 py-3">{search.country || "-"}</td>
                  <td className="px-4 py-3">{search.lead_count}</td>
                  <td className="px-4 py-3">{search.credit_cost}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(search.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <Link href={`/search/results?searchId=${search.id}`} className="inline-flex items-center gap-2 font-medium text-[#d8e0e8]">
                      Results <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

