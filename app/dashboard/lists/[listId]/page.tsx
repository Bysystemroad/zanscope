import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { LeadListDetail } from "@/components/lead-list-detail";
import { getLeadListDetail } from "@/lib/supabase/server";

export default async function LeadListDetailPage({ params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params;
  const { list, leads, demoMode } = await getLeadListDetail(listId);

  if (!list) {
    notFound();
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-2">
        <Link href="/dashboard/lists" className="text-sm font-medium text-muted-foreground hover:text-white">
          Back to lists
        </Link>
        <h1 className="text-3xl font-semibold tracking-normal text-white">{list.name}</h1>
        <p className="text-muted-foreground">
          {demoMode ? "Demo list leads are shown until Supabase auth is connected." : list.description || "Saved leads in this list."}
        </p>
      </div>
      <LeadListDetail listId={list.id} initialLeads={leads} />
    </AppShell>
  );
}
