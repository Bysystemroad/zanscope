"use client";

import Link from "next/link";
import { useState } from "react";
import { Download } from "lucide-react";
import { AddToListButton } from "@/components/add-to-list-button";
import { LeadScoreBadge } from "@/components/lead-score-badge";
import { Button } from "@/components/ui/button";
import { Lead } from "@/lib/dummy-data";
import { downloadLeadsCsv, downloadLeadsExcel } from "@/lib/lead-export";

function enrichmentLabel(status: Lead["scraper_status"]) {
  if (status === "found") return "Enriched";
  if (status === "not_found") return "No contact found";
  if (status === "failed") return "Needs review";
  return "Pending";
}

type SavedLeadsTableProps = {
  leads: Lead[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  filters: {
    country: string;
    city: string;
    emailFound: string;
    scraperStatus: string;
    quality: string;
  };
};

function pageHref(page: number, filters: SavedLeadsTableProps["filters"]) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return `/dashboard/leads?${params.toString()}`;
}

export function SavedLeadsTable({ leads, page, pageSize, total, totalPages, filters }: SavedLeadsTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedLeads = leads.filter((lead) => selectedIds.includes(lead.id));
  const exportRows = selectedLeads.length > 0 ? selectedLeads : leads;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  function updateFilter(key: keyof SavedLeadsTableProps["filters"], value: string) {
    const params = new URLSearchParams(window.location.search);
    params.set("page", "1");
    if (value) params.set(key, value);
    else params.delete(key);
    window.location.href = `/dashboard/leads?${params.toString()}`;
  }

  function submitTextFilter(key: "country" | "city", value: string) {
    if (value.trim() !== filters[key]) updateFilter(key, value.trim());
  }

  function toggleLead(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]));
  }

  function toggleAllVisible() {
    const visibleIds = leads.map((lead) => lead.id);
    const allVisibleSelected = visibleIds.every((id) => selectedIds.includes(id));
    setSelectedIds((current) =>
      allVisibleSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...current, ...visibleIds]))
    );
  }

  function exportCsv() {
    downloadLeadsCsv(exportRows, selectedLeads.length > 0 ? "zanscope-selected-leads.csv" : "zanscope-filtered-leads.csv");
  }

  function exportExcel() {
    downloadLeadsExcel(exportRows, selectedLeads.length > 0 ? "zanscope-selected-leads.xlsx" : "zanscope-filtered-leads.xlsx");
  }

  const selectClass = "h-10 rounded-md border border-white/10 bg-[#07111f] px-3 text-sm text-white shadow-sm outline-none focus:ring-2 focus:ring-white/30";
  const inputClass = `${selectClass} min-w-0`;

  return (
    <div className="glass-panel rounded-2xl">
      <div className="grid gap-3 border-b border-white/8 p-4 md:grid-cols-3 xl:grid-cols-6">
        <input
          className={inputClass}
          placeholder="Country"
          aria-label="Filter leads by country"
          defaultValue={filters.country}
          onBlur={(event) => submitTextFilter("country", event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") submitTextFilter("country", event.currentTarget.value);
          }}
        />
        <input
          className={inputClass}
          placeholder="City"
          aria-label="Filter leads by city"
          defaultValue={filters.city}
          onBlur={(event) => submitTextFilter("city", event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") submitTextFilter("city", event.currentTarget.value);
          }}
        />
        <select className={selectClass} value={filters.emailFound} aria-label="Filter leads by email status" onChange={(event) => updateFilter("emailFound", event.target.value)}>
          <option value="">Email status</option>
          <option value="yes">Email found</option>
          <option value="no">No email</option>
        </select>
        <select className={selectClass} value={filters.scraperStatus} aria-label="Filter leads by enrichment status" onChange={(event) => updateFilter("scraperStatus", event.target.value)}>
          <option value="">All enrichment statuses</option>
          <option value="found">Enriched</option>
          <option value="not_found">No contact found</option>
          <option value="failed">Needs review</option>
          <option value="pending">Pending</option>
        </select>
        <select className={selectClass} value={filters.quality} aria-label="Filter leads by quality score" onChange={(event) => updateFilter("quality", event.target.value)}>
          <option value="">All quality scores</option>
          <option value="High Quality">High Quality</option>
          <option value="Medium Quality">Medium Quality</option>
          <option value="Low Quality">Low Quality</option>
        </select>
        <div className="flex flex-wrap gap-2">
          <AddToListButton leadIds={selectedIds} />
          <Button type="button" variant="outline" className="shrink-0" onClick={exportCsv}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button type="button" variant="outline" className="shrink-0" onClick={exportExcel}>
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3 text-sm text-muted-foreground">
        <span>
          {from}-{to} of {total} leads / {selectedLeads.length} selected
        </span>
        <button type="button" className="font-medium text-white" onClick={toggleAllVisible}>
          Toggle visible
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1240px] text-left text-sm">
          <thead className="bg-white/6 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Select</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Website</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Enrichment</th>
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
                <td className="px-4 py-3">
                  {lead.city}, {lead.country}
                </td>
                <td className="px-4 py-3">{enrichmentLabel(lead.scraper_status)}</td>
                <td className="px-4 py-3">{lead.duplicate_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 px-4 py-3 text-sm text-muted-foreground">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          {page > 1 ? (
            <Link className="rounded-md border border-white/10 px-3 py-2 text-white hover:bg-white/8" href={pageHref(page - 1, filters)}>
              Previous
            </Link>
          ) : (
            <span className="rounded-md border border-white/10 px-3 py-2 opacity-40">Previous</span>
          )}
          {page < totalPages ? (
            <Link className="rounded-md border border-white/10 px-3 py-2 text-white hover:bg-white/8" href={pageHref(page + 1, filters)}>
              Next
            </Link>
          ) : (
            <span className="rounded-md border border-white/10 px-3 py-2 opacity-40">Next</span>
          )}
        </div>
      </div>
    </div>
  );
}

