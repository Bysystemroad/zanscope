import { AppShell } from "@/components/app-shell";
import { ResultsView } from "@/components/results-view";
import { leads } from "@/lib/dummy-data";
import { getSavedSearchResults } from "@/lib/supabase/server";

type ResultsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const resolvedParams = await searchParams;
  const keyword = typeof resolvedParams?.keyword === "string" ? resolvedParams.keyword : "";
  const city = typeof resolvedParams?.city === "string" ? resolvedParams.city : "";
  const country = typeof resolvedParams?.country === "string" ? resolvedParams.country : "";
  const industry = typeof resolvedParams?.industry === "string" ? resolvedParams.industry : "";
  const searchId = typeof resolvedParams?.searchId === "string" ? resolvedParams.searchId : undefined;
  const demo = resolvedParams?.demo === "true";
  const savedResults = await getSavedSearchResults(searchId);

  const titleLine = savedResults.search
    ? `${savedResults.search.keyword} / ${savedResults.search.industry || "All industries"} / ${savedResults.search.city}, ${savedResults.search.country}`
    : `${keyword || "New search"} / ${industry || "All industries"} / ${city || "Any city"}, ${country || "Any country"}`;

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-normal text-white">Search results</h1>
        <p className="text-muted-foreground">{titleLine}</p>
      </div>
      <ResultsView
        initialLeads={demo ? leads : searchId ? savedResults.leads : []}
        useSessionResults={!searchId && !demo}
        explicitDemo={demo}
        searchPayload={{ keyword, industry, city, country }}
      />
    </AppShell>
  );
}
