import Link from "next/link";
import { BarChart3, Clock3, CreditCard, ListChecks, Search, Settings, Users } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { userProfile } from "@/lib/dummy-data";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/search/new", label: "New Search", icon: Search },
  { href: "/dashboard/history", label: "History", icon: Clock3 },
  { href: "/dashboard/leads", label: "Saved Leads", icon: Users },
  { href: "/dashboard/lists", label: "Lists", icon: ListChecks },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard", label: "Settings", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
      <aside className="glass-panel sticky top-24 h-fit rounded-xl p-3">
        <div className="mb-4 px-2 pt-2">
          <BrandLogo href="/dashboard" />
        </div>
        <div className="mb-3 rounded-lg border border-white/10 bg-white/6 p-3">
          <div className="text-xs font-medium uppercase text-muted-foreground">Credits</div>
          <div className="mt-1 flex items-end justify-between">
            <span className="text-2xl font-semibold text-white">{userProfile.credits}</span>
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-muted-foreground">{userProfile.plan}</span>
          </div>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-white/8 hover:text-white"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <section className="min-w-0">{children}</section>
    </main>
  );
}

