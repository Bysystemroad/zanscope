import type { Metadata } from "next";
import Link from "next/link";
import { createSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = createSeoMetadata({
  title: "Contact Zanscope",
  description: "Contact Zanscope for questions about B2B lead discovery, CSV enrichment, credits, exports, and launch access.",
  path: "/contact",
  keywords: ["contact Zanscope", "Zanscope support", "B2B lead software contact"]
});

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#d8e0e8]">Contact</p>
      <h1 className="mt-3 text-4xl font-semibold text-white">Contact Zanscope</h1>
      <div className="mt-8 space-y-5 leading-7 text-muted-foreground">
        <p>
          Have a question about lead discovery, CSV enrichment, credits, exports, or early access? Send a note and
          the Zanscope team will follow up.
        </p>
        <p>
          Email <a className="text-white hover:underline" href="mailto:contact@zanscope.com">contact@zanscope.com</a>.
        </p>
      </div>
      <Link href="/" className="mt-8 inline-flex text-sm font-medium text-[#d8e0e8] hover:text-white">
        Back to Zanscope
      </Link>
    </main>
  );
}
