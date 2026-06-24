import { AppShell } from "@/components/app-shell";
import { SearchForm } from "@/components/search-form";

export default function NewSearchPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-normal text-white">New lead search</h1>
        <p className="mt-1 text-muted-foreground">Search a market, discover companies, extract emails, and save clean leads.</p>
      </div>
      <div className="premium-border rounded-2xl">
        <div className="glass-panel rounded-2xl p-6">
          <SearchForm />
        </div>
      </div>
    </AppShell>
  );
}
