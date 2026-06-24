"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { AddToListButton } from "@/components/add-to-list-button";
import { LeadScoreBadge } from "@/components/lead-score-badge";
import { Button } from "@/components/ui/button";
import { Lead, leadsToCsv } from "@/lib/dummy-data";

function uniqueValues(leads: Lead[], key: keyof Pick<Lead, "country" | "city" | "scraper_status">) {
  return Array.from(new Set(leads.map((lead) => String(lead[key] || "")).filter(Boolean))).sort();
}

export function SavedLeadsTable({ leads }: { leads: Lead[] }) {
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [emailFound, setEmailFound] = useState("");
  const [scraperStatus, setScraperStatus] = useState("");
  const [quality, setQuality] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredLeads = useMemo(
    () =>
      leads.filter((lead) => {
        if (country && lead.country !== country) return false;
        if (city && lead.city !== city) return false;
        if (scraperStatus && lead.scraper_status !== scraperStatus) return false;
        if (quality && lead.lead_quality !== quality) return false;
        if (emailFound === "yes" && !lead.email) return false;
        if (emailFound === "no" && lead.email) return false;
        return true;
      }).sort((a, b) => {
        if (b.lead_score !== a.lead_score) return b.lead_score - a.lead_score;
        return Date.parse(b.created_at) - Date.parse(a.created_at);
      }),
    [city, country, emailFound, leads, quality, scraperStatus]
  );

  const selectedLeads = filteredLeads.filter((lead) => selectedIds.includes(lead.id));
  const exportRows = selectedLeads.length > 0 ? selectedLeads : filteredLeads;

  function toggleLead(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]));
  }

  function toggleAllVisible() {
    const visibleIds = filteredLeads.map((lead) => lead.id);
    const allVisibleSelected = visibleIds.every((id) => selectedIds.includes(id));
    setSelectedIds((current) =>
      allVisibleSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...current, ...visibleIds]))
    );
  }

  function exportCsv() {
    const blob = new Blob([leadsToCsv(exportRows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = selectedLeads.length > 0 ? "zanscope-selected-leads.csv" : "zanscope-filtered-leads.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const selectClass = "h-10 rounded-md border border-white/10 bg-[#07111f] px-3 text-sm text-white shadow-sm outline-none focus:ring-2 focus:ring-white/30";

  return (
    <div className="glass-panel rounded-2xl">
      <div className="grid gap-3 border-b border-white/8 p-4 md:grid-cols-3 xl:grid-cols-6">
        <select className={selectClass} value={country} onChange={(event) => setCountry(event.target.value)}>
          <option value="">All countries</option>
          {uniqueValues(leads, "country").map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select className={selectClass} value={city} onChange={(event) => setCity(event.target.value)}>
          <option value="">All cities</option>
          {uniqueValues(leads, "city").map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select className={selectClass} value={emailFound} onChange={(event) => setEmailFound(event.target.value)}>
          <option value="">Email status</option>
          <option value="yes">Email found</option>
          <option value="no">No email</option>
        </select>
        <select className={selectClass} value={scraperStatus} onChange={(event) => setScraperStatus(event.target.value)}>
          <option value="">All scraper statuses</option>
          {uniqueValues(leads, "scraper_status").map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select className={selectClass} value={quality} onChange={(event) => setQuality(event.target.value)}>
          <option value="">All quality scores</option>
          <option value="High Quality">High Quality</option>
          <option value="Medium Quality">Medium Quality</option>
          <option value="Low Quality">Low Quality</option>
        </select>
        <div className="flex gap-2">
          <AddToListButton leadIds={selectedIds} />
          <Button type="button" variant="outline" onClick={exportCsv}>
            <Download className="h-4 w-4" />
            CSV
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3 text-sm text-muted-foreground">
        <span>
          {filteredLeads.length} visible / {selectedLeads.length} selected
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
              <th className="px-4 py-3">Scraper</th>
              <th className="px-4 py-3">Duplicates</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filteredLeads.map((lead) => (
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
                <td className="px-4 py-3">{lead.scraper_status}</td>
                <td className="px-4 py-3">{lead.duplicate_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

