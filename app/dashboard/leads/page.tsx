import { AppShell } from "@/components/app-shell";
import { SavedLeadsTable } from "@/components/saved-leads-table";
import { getSavedLeads } from "@/lib/supabase/server";

type SavedLeadsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function paramValue(params: Record<string, string | string[] | undefined> | undefined, key: string) {
  const value = params?.[key];
  return typeof value === "string" ? value : "";
}

export default async function SavedLeadsPage({ searchParams }: SavedLeadsPageProps) {
  const params = await searchParams;
  const page = Number(paramValue(params, "page") || 1);
  const result = await getSavedLeads({
    page,
    country: paramValue(params, "country"),
    city: paramValue(params, "city"),
    emailFound: paramValue(params, "emailFound"),
    scraperStatus: paramValue(params, "scraperStatus"),
    quality: paramValue(params, "quality")
  });
  const { leads, demoMode } = result;

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-normal text-white">Saved leads</h1>
        <p className="text-muted-foreground">
          {demoMode ? "Preview leads are shown until you sign in." : "All saved leads across your searches."}
        </p>
      </div>
      <SavedLeadsTable
        leads={leads}
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        totalPages={result.totalPages}
        filters={result.filters}
      />
    </AppShell>
  );
}
