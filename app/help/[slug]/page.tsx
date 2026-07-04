import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getHelpArticle, helpArticles, type HelpArticle } from "@/lib/help-content";
import { Button } from "@/components/ui/button";

export function generateStaticParams() {
  return helpArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getHelpArticle(slug);

  if (!article) {
    return {
      title: "Zanscope Help Center",
      description: "Helpful Zanscope guides for B2B lead search and enrichment."
    };
  }

  return {
    title: article.title,
    description: article.description
  };
}

export default async function HelpArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getHelpArticle(slug);

  if (!article) notFound();

  const relatedArticles = article.related.map(getHelpArticle).filter((related): related is HelpArticle => Boolean(related));

  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <Link href="/help" className="text-sm font-medium text-[#d8e0e8] hover:text-white">
        Help Center
      </Link>
      <article className="mt-6">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#d8e0e8]">{article.category}</div>
        <h1 className="mt-3 text-4xl font-semibold leading-tight text-white">{article.h1}</h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">{article.description}</p>
        <div className="mt-10 space-y-9">
          {article.sections.map((section) => (
            <section key={section.h2}>
              <h2 className="text-2xl font-semibold text-white">{section.h2}</h2>
              <div className="mt-4 space-y-4">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="leading-7 text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>

      <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <h2 className="text-lg font-semibold text-white">Related articles</h2>
        <div className="mt-4 grid gap-3">
          {relatedArticles.map((related) => (
            <Link key={related.slug} href={`/help/${related.slug}`} className="flex items-center justify-between rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 text-sm text-muted-foreground transition hover:text-white">
              {related.title}
              <ArrowRight className="h-4 w-4" />
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-10 premium-border rounded-3xl">
        <div className="glass-panel rounded-3xl p-8 text-center">
          <h2 className="text-2xl font-semibold text-white">Start building your lead list with Zanscope.</h2>
          <Link href="/login" className="mt-6 inline-flex">
            <Button>
              Get started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
