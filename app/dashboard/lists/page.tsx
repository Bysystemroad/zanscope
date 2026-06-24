import { AppShell } from "@/components/app-shell";
import { LeadListsManager } from "@/components/lead-lists-manager";
import { getLeadLists } from "@/lib/supabase/server";

export default async function LeadListsPage() {
  const { lists, demoMode } = await getLeadLists();

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-normal text-white">Lead lists</h1>
        <p className="text-muted-foreground">
          {demoMode ? "Demo lists are shown until Supabase auth is connected." : "Organize saved leads into focused prospect lists."}
        </p>
      </div>
      <LeadListsManager initialLists={lists} />
    </AppShell>
  );
}
