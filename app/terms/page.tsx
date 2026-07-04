import type { Metadata } from "next";
import Link from "next/link";
import { createSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = createSeoMetadata({
  title: "Terms of Service | Zanscope",
  description: "Review the Zanscope terms for using lead discovery, enrichment, saved lists, credits, and exports.",
  path: "/terms",
  keywords: ["Zanscope terms", "B2B lead software terms", "lead enrichment terms"]
});

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#d8e0e8]">Legal</p>
      <h1 className="mt-3 text-4xl font-semibold text-white">Terms of Service</h1>
      <div className="mt-8 space-y-5 leading-7 text-muted-foreground">
        <p>
          These placeholder terms describe the intended use of Zanscope for B2B lead discovery, list enrichment,
          credit-based processing, saved lead lists, and exports.
        </p>
        <p>
          A complete terms document will be published before broad commercial launch. Users are responsible for
          using exported business data responsibly and in accordance with applicable outreach and privacy rules.
        </p>
        <p>
          For questions, contact <a className="text-white hover:underline" href="mailto:contact@zanscope.com">contact@zanscope.com</a>.
        </p>
      </div>
      <Link href="/" className="mt-8 inline-flex text-sm font-medium text-[#d8e0e8] hover:text-white">
        Back to Zanscope
      </Link>
    </main>
  );
}
