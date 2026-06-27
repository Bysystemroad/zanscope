import { AppShell } from "@/components/app-shell";
import { EnrichmentWorkspace } from "@/components/enrichment-workspace";
import { getUserProfile } from "@/lib/supabase/server";

export default async function EnrichListPage() {
  const userProfile = await getUserProfile();

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-normal text-white">List Enrichment</h1>
        <p className="max-w-3xl text-muted-foreground">
          Upload a company CSV, map your columns, enrich missing contact data, score every lead, and export a clean prospect list.
        </p>
      </div>
      {userProfile.demoMode ? (
        <div className="glass-panel rounded-2xl p-6">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#d8e0e8]">Secure workspace required</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Log in to enrich your own company lists.</h2>
            <p className="mt-2 text-muted-foreground">
              List Enrichment saves leads, applies credits, and connects results to your saved lead lists.
            </p>
          </div>
        </div>
      ) : (
        <EnrichmentWorkspace />
      )}
    </AppShell>
  );
}
