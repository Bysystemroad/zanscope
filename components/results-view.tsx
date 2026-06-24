"use client";

import { useEffect, useState } from "react";
import { Lead } from "@/lib/dummy-data";
import { ResultsTable } from "@/components/results-table";

type SearchPayload = {
  keyword?: string;
  industry?: string;
  city?: string;
  country?: string;
};

type SearchResponse = {
  leads?: Lead[];
  fallback?: boolean;
  demoMode?: boolean;
  remainingCredits?: number | null;
  creditCost?: {
    total: number;
    uniqueLeadCredits: number;
    emailCredits: number;
  };
  insufficientCredits?: boolean;
  upgradeMessage?: string;
  api_error?: string | null;
  places_api_used?: boolean;
  source?: string;
};

export function ResultsView({
  initialLeads,
  useSessionResults = true,
  explicitDemo = false,
  searchPayload
}: {
  initialLeads: Lead[];
  useSessionResults?: boolean;
  explicitDemo?: boolean;
  searchPayload?: SearchPayload;
}) {
  const [leads, setLeads] = useState(initialLeads);
  const [fallback, setFallback] = useState(explicitDemo);
  const [demoMode, setDemoMode] = useState(explicitDemo);
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null);
  const [creditCost, setCreditCost] = useState<SearchResponse["creditCost"]>();
  const [upgradeMessage, setUpgradeMessage] = useState("");
  const [apiError, setApiError] = useState("");
  const [placesApiUsed, setPlacesApiUsed] = useState<boolean | undefined>(undefined);
  const [source, setSource] = useState<string | undefined>(explicitDemo ? "Demo" : undefined);
  const [loading, setLoading] = useState(Boolean(useSessionResults && !explicitDemo));

  useEffect(() => {
    if (!useSessionResults || explicitDemo) return;

    let cancelled = false;

    async function runSearch() {
      setLoading(true);
      setLeads([]);
      setApiError("");
      setFallback(false);
      setDemoMode(false);

      try {
        const response = await fetch("/api/searches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(searchPayload || {})
        });
        const parsed = (await response.json()) as SearchResponse;

        if (cancelled) return;

        setLeads(parsed.leads || []);
        setFallback(Boolean(parsed.fallback));
        setDemoMode(Boolean(parsed.demoMode));
        setRemainingCredits(parsed.remainingCredits ?? null);
        setCreditCost(parsed.creditCost);
        setUpgradeMessage(parsed.insufficientCredits ? parsed.upgradeMessage || "Upgrade or buy credits to save these leads." : "");
        setApiError(parsed.api_error || "");
        setPlacesApiUsed(parsed.places_api_used);
        setSource(parsed.source);
        window.sessionStorage.setItem("zanscope:last-search-results", JSON.stringify(parsed));
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : String(error);
        setLeads([]);
        setFallback(false);
        setDemoMode(false);
        setApiError(`Search request failed: ${message}`);
        setPlacesApiUsed(false);
        setSource("Google Places");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    runSearch();

    return () => {
      cancelled = true;
    };
  }, [explicitDemo, searchPayload, useSessionResults]);

  return (
    <ResultsTable
      leads={leads}
      fallback={fallback}
      demoMode={demoMode}
      remainingCredits={remainingCredits}
      creditCost={creditCost}
      upgradeMessage={upgradeMessage}
      apiError={apiError}
      placesApiUsed={placesApiUsed}
      source={source}
      loading={loading}
    />
  );
}
