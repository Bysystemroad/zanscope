"use client";

import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { LeadScoreBadge } from "@/components/lead-score-badge";
import { Button } from "@/components/ui/button";
import { Lead } from "@/lib/dummy-data";
import { downloadLeadsCsv, downloadLeadsExcel } from "@/lib/lead-export";

function LinkedInCell({ url }: { url?: string }) {
  if (!url) return <span className="text-muted-foreground">-</span>;

  return (
    <a href={url} target="_blank" rel="noreferrer" className="font-medium text-[#d8e0e8] hover:text-white">
      LinkedIn
    </a>
  );
}

export function LeadListDetail({ listId, initialLeads }: { listId: string; initialLeads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectedLeads = leads.filter((lead) => selectedIds.includes(lead.id));
  const exportRows = selectedLeads.length > 0 ? selectedLeads : leads;

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

  function exportCsv() {
    downloadLeadsCsv(exportRows, selectedLeads.length > 0 ? "zanscope-list-selected-leads.csv" : "zanscope-list-leads.csv");
  }

  function exportExcel() {
    downloadLeadsExcel(exportRows, selectedLeads.length > 0 ? "zanscope-list-selected-leads.xlsx" : "zanscope-list-leads.xlsx");
  }

  async function removeSelected() {
    if (selectedIds.length === 0) return;

    const response = await fetch(`/api/lead-lists/${listId}/items`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadIds: selectedIds })
    });

    if (!response.ok) return;

    setLeads((current) => current.filter((lead) => !selectedIds.includes(lead.id)));
    setSelectedIds([]);
  }

  return (
    <div className="glass-panel overflow-hidden rounded-2xl">
      <div className="flex flex-col gap-3 border-b border-white/8 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          {leads.length} leads / {selectedLeads.length} selected
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
          <Button type="button" variant="outline" className="shrink-0" onClick={exportCsv}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button type="button" variant="outline" className="shrink-0" onClick={exportExcel}>
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
          <Button type="button" variant="secondary" className="shrink-0" disabled={selectedIds.length === 0} onClick={removeSelected}>
            <Trash2 className="h-4 w-4" />
            Remove
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1260px] text-left text-sm">
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
              <th className="px-4 py-3">LinkedIn</th>
              <th className="px-4 py-3">Location</th>
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
                <td className="px-4 py-3"><LinkedInCell url={lead.linkedin_url} /></td>
                <td className="px-4 py-3">
                  {lead.city}, {lead.country}
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
