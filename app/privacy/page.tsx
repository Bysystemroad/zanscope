import type { Metadata } from "next";
import Link from "next/link";
import { createSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = createSeoMetadata({
  title: "Privacy Policy | Zanscope",
  description: "Read the Zanscope privacy policy for account data, saved searches, lead lists, exports, and credit workflows.",
  path: "/privacy",
  keywords: ["Zanscope privacy policy", "lead data privacy", "B2B prospecting privacy"]
});

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#d8e0e8]">Legal</p>
      <h1 className="mt-3 text-4xl font-semibold text-white">Privacy Policy</h1>
      <div className="mt-8 space-y-5 leading-7 text-muted-foreground">
        <p>
          Zanscope is designed for B2B prospecting and market research workflows. Your account, saved searches,
          lead lists, exports, credits, and enrichment jobs stay linked to your workspace.
        </p>
        <p>
          This placeholder policy will be expanded before broad commercial launch with full details about data
          collection, processing, retention, and user rights.
        </p>
        <p>
          For privacy questions, contact <a className="text-white hover:underline" href="mailto:contact@zanscope.com">contact@zanscope.com</a>.
        </p>
      </div>
      <Link href="/" className="mt-8 inline-flex text-sm font-medium text-[#d8e0e8] hover:text-white">
        Back to Zanscope
      </Link>
    </main>
  );
}
