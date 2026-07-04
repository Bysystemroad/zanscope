import type { Metadata } from "next";
import { LandingPageClient } from "@/components/landing-page-client";
import { absoluteUrl, createSeoMetadata, siteName } from "@/lib/seo";

const title = "Zanscope | Find, Enrich and Export B2B Leads";
const description =
  "Build high-quality B2B prospect lists in minutes. Discover companies, enrich contact data, score lead quality, remove duplicates, and export Excel or CSV files.";

export const metadata: Metadata = createSeoMetadata({
  title,
  description,
  keywords: [
    "B2B leads",
    "lead enrichment software",
    "company search tool",
    "CSV list enrichment",
    "sales prospecting software",
    "lead quality scoring",
    "Excel lead export"
  ]
});

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteName,
  url: absoluteUrl("/"),
  logo: absoluteUrl("/zanscope-logo.png"),
  contactPoint: {
    "@type": "ContactPoint",
    email: "contact@zanscope.com",
    contactType: "customer support"
  }
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: siteName,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: absoluteUrl("/"),
  description,
  offers: {
    "@type": "Offer",
    category: "Credit packages",
    availability: "https://schema.org/InStock"
  }
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is a credit?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A credit is used when Zanscope processes or enriches a company record. Email enrichment may require an additional credit."
      }
    },
    {
      "@type": "Question",
      name: "Can I upload my own CSV?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. You can upload a company list and enrich it with websites, emails, phones, addresses, and quality scores."
      }
    },
    {
      "@type": "Question",
      name: "Can I export results?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. You can export results to Excel or CSV."
      }
    },
    {
      "@type": "Question",
      name: "Is Zanscope only for new lead searches?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. You can also enrich existing company lists and organize leads into saved lists."
      }
    }
  ]
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <LandingPageClient />
    </>
  );
}
