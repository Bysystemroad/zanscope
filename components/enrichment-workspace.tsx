"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { Download, FileSpreadsheet, Loader2, UploadCloud } from "lucide-react";
import { AddToListButton } from "@/components/add-to-list-button";
import { LeadScoreBadge } from "@/components/lead-score-badge";
import { Button } from "@/components/ui/button";
import type { CsvRow } from "@/lib/csv-upload";
import type { Lead } from "@/lib/dummy-data";
import { downloadLeadsCsv, downloadLeadsExcel } from "@/lib/lead-export";

type ColumnMapping = {
  companyName: string;
  website: string;
  country: string;
  city: string;
  email: string;
  phone: string;
};

type PreviewResponse = {
  fileName: string;
  delimiter: "," | ";";
  columns: string[];
  rows: CsvRow[];
  rowCount: number;
  truncated: boolean;
  mapping: ColumnMapping;
  error?: string;
};

type StartResponse = {
  id?: string;
  leads?: Lead[];
  creditCost?: { total: number };
  remainingCredits?: number;
  requiredCredits?: number;
  insufficientCredits?: boolean;
  error?: string;
};

const emptyMapping: ColumnMapping = {
  companyName: "",
  website: "",
  country: "",
  city: "",
  email: "",
  phone: ""
};

const inputClass =
  "h-11 w-full rounded-md border border-white/10 bg-[#07111f] px-3 text-sm text-white outline-none placeholder:text-muted-foreground focus:border-white/30 focus:ring-2 focus:ring-white/15";

const labelClass = "text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground";

const enrichmentLoadingSteps = [
  "Reading uploaded file",
  "Mapping company rows",
  "Matching companies",
  "Enriching contact details",
  "Preparing enriched export"
];

function cleanMessage(message: string) {
  return message
    .replace(/Google Places|Google Maps|Google API|Places API|Google Search|Google/gi, "Business Intelligence Engine")
    .replace(/Apify/gi, "Internal Discovery Engine")
    .replace(/Supabase/gi, "workspace")
    .replace(/\bAPI\b/g, "service");
}

function statusForLead(lead: Lead) {
  if (lead.email && lead.website) return "Enriched";
  if (lead.website || lead.email || lead.phone) return "Partial";
  if (lead.scraper_status === "failed") return "Failed";
  return "Not Found";
}

function statusClass(status: string) {
  if (status === "Enriched") return "border-emerald-300/20 bg-emerald-300/10 text-emerald-100";
  if (status === "Partial") return "border-sky-200/20 bg-sky-200/10 text-sky-100";
  if (status === "Failed") return "border-rose-300/20 bg-rose-300/10 text-rose-100";
  return "border-white/10 bg-white/6 text-muted-foreground";
}

function LinkedInCell({ url }: { url?: string }) {
  if (!url) return <span className="text-muted-foreground">-</span>;

  return (
    <a href={url} target="_blank" rel="noreferrer" className="font-medium text-[#d8e0e8] hover:text-white">
      LinkedIn
    </a>
  );
}

function columnLabel(key: keyof ColumnMapping) {
  const labels: Record<keyof ColumnMapping, string> = {
    companyName: "Company Name",
    website: "Website",
    country: "Country",
    city: "City",
    email: "Email",
    phone: "Phone"
  };
  return labels[key];
}

export function EnrichmentWorkspace() {
  const [fileName, setFileName] = useState("");
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [truncated, setTruncated] = useState(false);
  const [delimiter, setDelimiter] = useState<"," | ";">(",");
  const [mapping, setMapping] = useState<ColumnMapping>(emptyMapping);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<"idle" | "preview" | "enriching" | "complete">("idle");
  const [credits, setCredits] = useState<{ cost?: number; remaining?: number }>({});

  const previewRows = rows.slice(0, 8);
  const sortedLeads = useMemo(
    () =>
      [...leads].sort((a, b) => {
        if (b.lead_score !== a.lead_score) return b.lead_score - a.lead_score;
        return a.company_name.localeCompare(b.company_name);
      }),
    [leads]
  );
  const selectedLeads = sortedLeads.filter((lead) => selectedIds.includes(lead.id));
  const exportRows = selectedLeads.length > 0 ? selectedLeads : sortedLeads;

  async function previewFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setMessage("Upload a CSV file to start List Enrichment.");
      return;
    }

    setLoading(true);
    setMessage("");
    setLeads([]);
    setSelectedIds([]);
    setCredits({});

    try {
      const content = await file.text();
      const response = await fetch("/api/enrichment/upload-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, content })
      });
      const data = (await response.json()) as PreviewResponse;

      if (!response.ok) {
        throw new Error(data.error || "The CSV preview could not be created.");
      }

      setFileName(data.fileName);
      setColumns(data.columns);
      setRows(data.rows);
      setRowCount(data.rowCount);
      setTruncated(data.truncated);
      setDelimiter(data.delimiter);
      setMapping({ ...emptyMapping, ...data.mapping });
      setPhase("preview");
    } catch (error) {
      setMessage(cleanMessage(error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  }

  async function startEnrichment() {
    if (!mapping.companyName) {
      setMessage("Map the required Company Name column before starting enrichment.");
      return;
    }

    setLoading(true);
    setMessage("");
    setPhase("enriching");

    try {
      const response = await fetch("/api/enrichment/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName, rows, mapping })
      });
      const data = (await response.json()) as StartResponse;

      if (!response.ok || !data.leads) {
        throw new Error(data.error || "List Enrichment could not be completed.");
      }

      setLeads(data.leads);
      setSelectedIds(data.leads.map((lead) => lead.id));
      setCredits({ cost: data.creditCost?.total, remaining: data.remainingCredits });
      setPhase("complete");
      setMessage(`${data.leads.length} unique leads enriched and saved.`);
    } catch (error) {
      setPhase("preview");
      setMessage(cleanMessage(error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  }

  function toggleLead(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]));
  }

  function toggleAll() {
    const allIds = sortedLeads.map((lead) => lead.id);
    const allSelected = allIds.every((id) => selectedIds.includes(id));
    setSelectedIds(allSelected ? [] : allIds);
  }

  function updateMapping(key: keyof ColumnMapping, value: string) {
    setMapping((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel overflow-hidden rounded-2xl">
        <div className="grid gap-6 p-5 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="flex items-start gap-4">
              <div className="rounded-xl border border-white/10 bg-white/6 p-3 text-white">
                <UploadCloud className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Upload company CSV</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Import up to 100 rows. Zanscope supports comma or semicolon separated files with UTF-8 characters.
                </p>
              </div>
            </div>
            <label className="mt-5 flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/18 bg-white/[0.03] px-4 py-8 text-center transition hover:bg-white/[0.06]">
              <FileSpreadsheet className="h-8 w-8 text-[#d8e0e8]" />
              <span className="mt-3 text-sm font-medium text-white">{fileName || "Choose a CSV file"}</span>
              <span className="mt-1 text-xs text-muted-foreground">Preview appears before enrichment starts.</span>
              <input className="sr-only" type="file" accept=".csv,text/csv" onChange={previewFile} />
            </label>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className={labelClass}>Processing rules</div>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p>Unique companies are processed before credits are calculated.</p>
              <p>Existing emails and phone numbers are preserved unless cleaner contact data is found.</p>
              <p>Credits are charged only after enriched leads are saved successfully.</p>
            </div>
            {rowCount > 0 && (
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-white/10 bg-[#07111f] p-3">
                  <div className="text-muted-foreground">Rows</div>
                  <div className="mt-1 text-xl font-semibold text-white">{rowCount}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-[#07111f] p-3">
                  <div className="text-muted-foreground">Delimiter</div>
                  <div className="mt-1 text-xl font-semibold text-white">{delimiter === ";" ? "Semicolon" : "Comma"}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {columns.length > 0 && (
        <section className="glass-panel rounded-2xl p-5">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Map columns</h2>
              <p className="text-sm text-muted-foreground">Company Name is required. Other fields improve matching and enrichment quality.</p>
            </div>
            {truncated && <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-muted-foreground">First 100 rows selected</span>}
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(Object.keys(emptyMapping) as Array<keyof ColumnMapping>).map((key) => (
              <label key={key} className="space-y-2">
                <span className={labelClass}>
                  {columnLabel(key)}
                  {key === "companyName" ? " *" : ""}
                </span>
                <select className={inputClass} value={mapping[key]} onChange={(event) => updateMapping(key, event.target.value)}>
                  <option value="">Not mapped</option>
                  {columns.map((column) => (
                    <option key={column} value={column}>
                      {column}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button type="button" disabled={loading || rows.length === 0 || !mapping.companyName} onClick={startEnrichment}>
              {loading && phase === "enriching" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Start Enrichment
            </Button>
            <span className="text-sm text-muted-foreground">Estimated minimum: {rows.length} credits before contact enrichment.</span>
          </div>
        </section>
      )}

      {previewRows.length > 0 && (
        <section className="glass-panel rounded-2xl">
          <div className="border-b border-white/8 p-5">
            <h2 className="text-xl font-semibold text-white">Preview</h2>
            <p className="text-sm text-muted-foreground">Review imported rows before using credits.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-white/6 text-xs uppercase text-muted-foreground">
                <tr>
                  {columns.slice(0, 8).map((column) => (
                    <th key={column} className="px-4 py-3">{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {previewRows.map((row, index) => (
                  <tr key={`${fileName}-${index}`} className="hover:bg-white/5">
                    {columns.slice(0, 8).map((column) => (
                      <td key={column} className="max-w-[240px] truncate px-4 py-3 text-[#d8e0e8]" title={row[column]}>
                        {row[column] || "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {message && (
        <div className="rounded-xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-[#d8e0e8]">
          {message}
        </div>
      )}

      {phase === "enriching" && (
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center gap-3 text-white">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="font-medium">Preparing your enriched lead list...</span>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-5">
            {enrichmentLoadingSteps.map((step, index) => (
              <div key={step} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full animate-pulse rounded-full bg-white/80"
                    style={{ width: `${Math.min(100, 38 + index * 13)}%` }}
                  />
                </div>
                <div className="text-xs font-medium text-[#d8e0e8]">{step}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sortedLeads.length > 0 && (
        <section className="glass-panel rounded-2xl">
          <div className="flex flex-col gap-4 border-b border-white/8 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Enrichment results</h2>
              <p className="text-sm text-muted-foreground">
                {sortedLeads.length} unique leads. {selectedIds.length} selected.
                {credits.cost !== undefined ? ` ${credits.cost} credits used.` : ""}
                {credits.remaining !== undefined ? ` ${credits.remaining} credits remaining.` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <AddToListButton leadIds={selectedIds} />
              <Button type="button" variant="outline" disabled={exportRows.length === 0} onClick={() => downloadLeadsCsv(exportRows, "zanscope-enriched-leads.csv")}>
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button type="button" variant="outline" disabled={exportRows.length === 0} onClick={() => downloadLeadsExcel(exportRows, "zanscope-enriched-leads.xlsx")}>
                <Download className="h-4 w-4" />
                Export Excel
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between border-b border-white/8 px-5 py-3 text-sm text-muted-foreground">
            <span>Select enriched leads for export or list saving.</span>
            <button type="button" className="font-medium text-white" onClick={toggleAll}>
              Toggle all
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1340px] text-left text-sm">
              <thead className="bg-white/6 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Select</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Website</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">LinkedIn</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Duplicates</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {sortedLeads.map((lead) => {
                  const status = statusForLead(lead);
                  return (
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
                      <td className="px-4 py-3"><LeadScoreBadge score={lead.lead_score} quality={lead.lead_quality} /></td>
                      <td className="max-w-[240px] truncate px-4 py-3 text-[#d8e0e8]" title={lead.website}>{lead.website || "-"}</td>
                      <td className="px-4 py-3">{lead.email || "-"}</td>
                      <td className="px-4 py-3">{lead.phone || "-"}</td>
                      <td className="px-4 py-3"><LinkedInCell url={lead.linkedin_url} /></td>
                      <td className="max-w-[260px] truncate px-4 py-3" title={lead.address}>{lead.address || "-"}</td>
                      <td className="px-4 py-3">{[lead.city, lead.country].filter(Boolean).join(", ") || "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2.5 py-1 text-xs ${statusClass(status)}`}>{status}</span>
                      </td>
                      <td className="px-4 py-3">{lead.duplicate_count}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
