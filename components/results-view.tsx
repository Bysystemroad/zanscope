"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Lead } from "@/lib/dummy-data";
import { ResultsTable } from "@/components/results-table";

type SearchPayload = {
  keyword?: string;
  industry?: string;
  city?: string;
  country?: string;
  requestId?: string;
};

type SearchResponse = {
  id?: string;
  saved?: boolean;
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

const inFlightSearches = new Map<string, Promise<SearchResponse>>();

function getStorageKey(payloadKey: string) {
  return `zanscope:search-response:${payloadKey}`;
}

async function postSearch(payloadKey: string, searchPayload?: SearchPayload) {
  const existingRequest = inFlightSearches.get(payloadKey);

  if (existingRequest) {
    return existingRequest;
  }

  const request = fetch("/api/searches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(searchPayload || {})
  }).then((response) => response.json() as Promise<SearchResponse>);

  inFlightSearches.set(payloadKey, request);

  try {
    return await request;
  } finally {
    inFlightSearches.delete(payloadKey);
  }
}

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
  const router = useRouter();
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
  const hasRunRef = useRef<string | null>(null);
  const payloadKey = useMemo(
    () =>
      JSON.stringify({
        requestId: searchPayload?.requestId || "",
        keyword: searchPayload?.keyword || "",
        industry: searchPayload?.industry || "",
        city: searchPayload?.city || "",
        country: searchPayload?.country || ""
      }),
    [searchPayload?.city, searchPayload?.country, searchPayload?.industry, searchPayload?.keyword, searchPayload?.requestId]
  );

  useEffect(() => {
    if (!useSessionResults || explicitDemo) return;
    if (hasRunRef.current === payloadKey) return;

    hasRunRef.current = payloadKey;

    let cancelled = false;

    function applyResponse(parsed: SearchResponse) {
      setLeads(parsed.leads || []);
      setFallback(Boolean(parsed.fallback));
      setDemoMode(Boolean(parsed.demoMode));
      setRemainingCredits(parsed.remainingCredits ?? null);
      setCreditCost(parsed.creditCost);
      setUpgradeMessage(parsed.insufficientCredits ? parsed.upgradeMessage || "Upgrade or buy credits to save these leads." : "");
      setApiError(parsed.api_error || "");
      setPlacesApiUsed(parsed.places_api_used);
      setSource(parsed.source);
    }

    async function runSearch() {
      setLoading(true);
      setLeads([]);
      setApiError("");
      setFallback(false);
      setDemoMode(false);

      try {
        const cachedResponse = window.sessionStorage.getItem(getStorageKey(payloadKey));
        const parsed = cachedResponse ? (JSON.parse(cachedResponse) as SearchResponse) : await postSearch(payloadKey, searchPayload);

        window.sessionStorage.setItem(getStorageKey(payloadKey), JSON.stringify(parsed));

        if (cancelled) return;

        applyResponse(parsed);

        if (parsed.saved && parsed.id && !parsed.demoMode) {
          router.replace(`/search/results?searchId=${encodeURIComponent(parsed.id)}`, { scroll: false });
        }
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : String(error);
        setLeads([]);
        setFallback(false);
        setDemoMode(false);
        setApiError(`Search request failed: ${message}`);
        setPlacesApiUsed(false);
        setSource("ZanScope");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    runSearch();

    return () => {
      cancelled = true;
    };
  }, [explicitDemo, payloadKey, router, searchPayload, useSessionResults]);

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
