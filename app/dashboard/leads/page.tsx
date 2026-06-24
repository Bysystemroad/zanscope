import { AppShell } from "@/components/app-shell";
import { SavedLeadsTable } from "@/components/saved-leads-table";
import { getSavedLeads } from "@/lib/supabase/server";

export default async function SavedLeadsPage() {
  const { leads, demoMode } = await getSavedLeads();

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-normal text-white">Saved leads</h1>
        <p className="text-muted-foreground">
          {demoMode ? "Demo leads are shown until Supabase auth is connected." : "All saved leads across your searches."}
        </p>
      </div>
      <SavedLeadsTable leads={leads} />
    </AppShell>
  );
}
