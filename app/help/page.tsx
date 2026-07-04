import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { helpArticles, helpCategories } from "@/lib/help-content";

export const metadata: Metadata = {
  title: "Zanscope Help Center | B2B Lead Search, CSV Enrichment and Exports",
  description: "Learn how to use Zanscope to find B2B leads, enrich CSV company lists, manage credits, build lead lists, and export to Excel or CSV."
};

export default function HelpCenterPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#d8e0e8]">Help Center</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Learn how to build cleaner B2B lead lists with Zanscope</h1>
        <p className="mt-4 leading-7 text-muted-foreground">
          Practical guides for lead search, CSV enrichment, credits, exports, saved lists, and better prospecting workflows.
        </p>
      </div>
      <div className="mb-8 grid gap-3 md:grid-cols-3">
        {helpCategories.map((category) => (
          <div key={category} className="glass-panel rounded-2xl p-5">
            <BookOpen className="h-5 w-5 text-[#d8e0e8]" />
            <h2 className="mt-4 font-semibold text-white">{category}</h2>
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {helpArticles.map((article) => (
          <Link key={article.slug} href={`/help/${article.slug}`} className="glass-panel rounded-2xl p-5 transition hover:-translate-y-1 hover:border-white/20">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d8e0e8]">{article.category}</div>
            <h2 className="mt-3 text-xl font-semibold text-white">{article.title}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{article.description}</p>
            <div className="mt-5 flex items-center gap-2 text-sm font-medium text-white">
              Read article <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
