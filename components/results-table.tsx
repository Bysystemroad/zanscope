"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Send } from "lucide-react";
import { AddToListButton } from "@/components/add-to-list-button";
import { LeadScoreBadge } from "@/components/lead-score-badge";
import { Button } from "@/components/ui/button";
import { Lead, leadsToCsv } from "@/lib/dummy-data";

type ResultsTableProps = {
  leads: Lead[];
  fallback?: boolean;
  demoMode?: boolean;
  remainingCredits?: number | null;
  creditCost?: {
    total: number;
    uniqueLeadCredits: number;
    emailCredits: number;
  };
  upgradeMessage?: string;
  apiError?: string;
  placesApiUsed?: boolean;
  source?: string;
  loading?: boolean;
};

export function ResultsTable({
  leads,
  fallback = false,
  demoMode = false,
  remainingCredits,
  creditCost,
  upgradeMessage,
  apiError,
  loading = false
}: ResultsTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  function exportCsv() {
    const blob = new Blob([leadsToCsv(leads)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "zanscope-leads.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function toggleLead(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]));
  }

  function toggleAllVisible() {
    const visibleIds = leads.map((lead) => lead.id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
    setSelectedIds((current) =>
      allVisibleSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...current, ...visibleIds]))
    );
  }

  const resultLabel = apiError ? "Search failed" : demoMode || fallback ? "Demo mode" : "Real search results";

  return (
    <div className="glass-panel overflow-hidden rounded-2xl">
      <div className="flex flex-col gap-3 border-b border-white/8 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-white">Lead results</h2>
          <p className="text-sm text-muted-foreground">
            {loading ? "Searching..." : `${leads.length} ${resultLabel}`}
          </p>
          {(demoMode || fallback) && (
            <p className="mt-1 text-sm text-muted-foreground">Create an account or log in to run real searches.</p>
          )}
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {demoMode && <span>demo_mode: true</span>}
            {apiError && <span>Search error. Check server configuration.</span>}
            {typeof remainingCredits === "number" && <span>Remaining credits: {remainingCredits}</span>}
            {creditCost && (
              <span>
                Cost: {creditCost.total} ({creditCost.uniqueLeadCredits} leads + {creditCost.emailCredits} emails)
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(demoMode || fallback) && (
            <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center rounded-md bg-white px-4 text-sm font-medium text-[#080f14] transition hover:bg-[#f1f4f6]"
            >
              Log in to run real searches
            </Link>
          )}
          <AddToListButton leadIds={selectedIds} disabled={loading || demoMode || fallback} />
          <Button type="button" variant="outline" onClick={exportCsv}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button type="button" variant="secondary">
            <Send className="h-4 w-4" />
            Send to Zantevo
          </Button>
        </div>
      </div>
      {upgradeMessage && (
        <div className="border-b bg-accent/15 px-4 py-3 text-sm font-medium text-foreground">
          {upgradeMessage}
        </div>
      )}
      {apiError && (
        <div className="border-b border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white">
          Lead discovery failed. Check server configuration and try again.
        </div>
      )}
      {loading && (
        <div className="border-b border-white/10 px-4 py-8 text-sm text-muted-foreground">
          Contacting `/api/searches` and preparing clean lead results...
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1300px] text-left text-sm">
          <thead className="bg-white/6 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">
                <button type="button" className="font-medium text-white" onClick={toggleAllVisible}>
                  Select
                </button>
              </th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Website</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Scraper</th>
              <th className="px-4 py-3">Duplicates</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-white/5">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(lead.id)}
                    onChange={() => toggleLead(lead.id)}
                    aria-label={`Select ${lead.company_name}`}
                  />
                </td>
                <td className="px-4 py-3 font-medium text-white">{lead.company_name}</td>
                <td className="px-4 py-3">
                  <LeadScoreBadge score={lead.lead_score} quality={lead.lead_quality} />
                </td>
                <td className="px-4 py-3 text-[#d8e0e8]">{lead.website || "-"}</td>
                <td className="px-4 py-3">{lead.email || "-"}</td>
                <td className="px-4 py-3">{lead.phone || "-"}</td>
                <td className="px-4 py-3">{lead.address || "-"}</td>
                <td className="px-4 py-3">
                  {lead.city}, {lead.country}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-md border border-white/10 bg-white/6 px-2 py-1 text-xs font-medium text-white">
                    {lead.scraper_status}
                  </span>
                </td>
                <td className="px-4 py-3">{lead.duplicate_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

