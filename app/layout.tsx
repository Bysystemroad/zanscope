import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZanScope | B2B Lead Discovery",
  description: "Discover company leads by keyword, location, and industry."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <div className="min-h-screen">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07111c]/88 shadow-[0_12px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <div className="mx-auto grid h-24 max-w-7xl grid-cols-[minmax(320px,1fr)_auto_minmax(160px,1fr)] items-center px-4 sm:px-6 lg:px-8">
              <BrandLogo className="justify-self-start" />
              <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
                <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
                <Link href="/search/new" className="hover:text-white">New Search</Link>
                <Link href="/dashboard/leads" className="hover:text-white">Saved Leads</Link>
                <Link href="/dashboard/lists" className="hover:text-white">Lists</Link>
                <Link href="/billing" className="hover:text-white">Billing</Link>
              </nav>
              <Link
                href="/login"
                className="justify-self-end rounded-md border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 hover:shadow-[0_0_24px_rgba(255,255,255,0.14)]"
              >
                Login
              </Link>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}

