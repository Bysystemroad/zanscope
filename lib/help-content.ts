export type HelpArticle = {
  slug: string;
  category: string;
  title: string;
  description: string;
  h1: string;
  sections: Array<{
    h2: string;
    body: string[];
  }>;
  related: string[];
};

export const helpArticles: HelpArticle[] = [
  {
    slug: "how-zanscope-works",
    category: "Getting Started",
    title: "How Zanscope Works: Find, Enrich and Export B2B Leads",
    description: "Learn how Zanscope helps teams find companies, enrich contact data, score leads, save lists, and export Excel or CSV files.",
    h1: "How Zanscope Works",
    sections: [
      {
        h2: "What Zanscope does",
        body: [
          "Zanscope is a B2B lead workspace for finding companies, enriching contact details, scoring lead quality, removing duplicates, and exporting clean prospect lists.",
          "Teams can start from a market search or upload an existing CSV company list for enrichment."
        ]
      },
      {
        h2: "Lead Search",
        body: [
          "Lead Search helps you define a market using keyword, industry, country, and city fields.",
          "The result is a structured company table with websites, emails when available, phone numbers, addresses, quality scores, and duplicate counts."
        ]
      },
      {
        h2: "List Enrichment",
        body: [
          "List Enrichment lets you upload your own company CSV, map columns, and fill missing company and contact information.",
          "This is useful when you already have raw company names but need cleaner outreach-ready data."
        ]
      },
      {
        h2: "Lead Quality Score, saved lists, and export",
        body: [
          "Every lead receives a rule-based quality score that helps you prioritize complete and useful records.",
          "You can save qualified leads into lists and export results to Excel or CSV for outreach, market research, or client delivery."
        ]
      }
    ],
    related: ["how-to-find-b2b-leads", "how-to-enrich-a-csv-list", "how-to-export-leads-to-excel"]
  },
  {
    slug: "how-to-find-b2b-leads",
    category: "Lead Search",
    title: "How to Find B2B Leads with Zanscope",
    description: "A practical guide to choosing search criteria, reviewing results, saving leads, and building targeted B2B prospect lists.",
    h1: "How to Find B2B Leads with Zanscope",
    sections: [
      {
        h2: "Choose a focused market",
        body: [
          "Start with a specific keyword, industry, country, and city. Focused searches usually produce cleaner lead lists than broad searches.",
          "For example, search for a clear product category, service type, or buyer segment instead of a generic phrase."
        ]
      },
      {
        h2: "Review results carefully",
        body: [
          "Review company names, websites, emails, phone numbers, addresses, duplicate counts, and lead scores.",
          "Use the score as a prioritization signal, then inspect the companies that best match your target market."
        ]
      },
      {
        h2: "Save qualified leads",
        body: [
          "Select the leads that fit your campaign and save them to a lead list.",
          "Organized lists make it easier to export clean segments for outreach or market research."
        ]
      }
    ],
    related: ["how-zanscope-works", "how-to-build-b2b-lead-lists", "b2b-lead-generation-best-practices"]
  },
  {
    slug: "how-to-enrich-a-csv-list",
    category: "CSV Enrichment",
    title: "How to Enrich a CSV Company List",
    description: "Learn how to upload a CSV, map company columns, enrich missing data, review results, and export a clean file.",
    h1: "How to Enrich a CSV Company List",
    sections: [
      {
        h2: "Upload your CSV",
        body: [
          "Open List Enrichment and upload a CSV containing company names. You can include websites, countries, cities, emails, and phone numbers when available.",
          "The first version supports up to 100 rows per upload."
        ]
      },
      {
        h2: "Map required and optional fields",
        body: [
          "Company Name is required. Website, Country, City, Email, and Phone are optional but can improve enrichment quality.",
          "Review the preview table before starting enrichment so the mapped columns match your file."
        ]
      },
      {
        h2: "Review and export enriched data",
        body: [
          "After enrichment, review websites, emails, phone numbers, addresses, lead scores, and enrichment status.",
          "Export the enriched list to Excel or CSV, or save selected leads into a lead list."
        ]
      }
    ],
    related: ["how-credits-work", "how-to-export-leads-to-excel", "how-to-build-b2b-lead-lists"]
  },
  {
    slug: "how-credits-work",
    category: "Credits & Billing",
    title: "How Credits Work in Zanscope",
    description: "Understand Zanscope credits, search costs, enrichment costs, email enrichment, credit purchases, and balance monitoring.",
    h1: "How Credits Work in Zanscope",
    sections: [
      {
        h2: "What credits are",
        body: [
          "Credits measure how many company records Zanscope processes or enriches.",
          "A saved unique lead costs 1 credit. If an email is found, email enrichment may require an additional credit."
        ]
      },
      {
        h2: "Search and enrichment cost",
        body: [
          "Lead searches and CSV enrichment calculate credit cost from the final unique records, not duplicate raw results.",
          "If your balance is too low, Zanscope stops before saving and charging."
        ]
      },
      {
        h2: "Buying and monitoring credits",
        body: [
          "You can buy one-time credit packages from Billing.",
          "Your current balance appears in the sidebar and Billing page so you can monitor usage."
        ]
      }
    ],
    related: ["how-to-find-b2b-leads", "how-to-enrich-a-csv-list", "how-to-export-leads-to-excel"]
  },
  {
    slug: "how-to-export-leads-to-excel",
    category: "Exporting",
    title: "How to Export Leads to Excel or CSV",
    description: "Learn how Zanscope exports lead data to Excel or CSV and how to use exported files in outreach workflows.",
    h1: "How to Export Leads to Excel or CSV",
    sections: [
      {
        h2: "Export Excel",
        body: [
          "Use Export Excel when you want a formatted spreadsheet with a clean header row and readable columns.",
          "Excel exports are useful for sales teams, export managers, and client-ready reporting."
        ]
      },
      {
        h2: "Export CSV",
        body: [
          "Use Export CSV when you need a lightweight file for CRMs, outreach tools, or custom workflows.",
          "Zanscope keeps addresses and special characters structured for cleaner spreadsheet handling."
        ]
      },
      {
        h2: "What columns are included",
        body: [
          "Exports include company name, website, email, phone, address, city, country, enrichment status, duplicate count, lead score, lead quality, and created date.",
          "Use exports to prepare outreach lists, research new markets, or deliver clean prospect files."
        ]
      }
    ],
    related: ["how-to-build-b2b-lead-lists", "how-to-enrich-a-csv-list", "b2b-lead-generation-best-practices"]
  },
  {
    slug: "how-to-build-b2b-lead-lists",
    category: "Lead Search",
    title: "How to Build and Organize B2B Lead Lists",
    description: "Learn how to use saved leads and lead lists to organize B2B prospects by market, country, industry, or campaign.",
    h1: "How to Build and Organize B2B Lead Lists",
    sections: [
      {
        h2: "Saved Leads",
        body: [
          "Saved Leads collects lead records from searches and enrichment jobs in one workspace.",
          "You can filter by country, city, source label, email status, enrichment status, and quality score."
        ]
      },
      {
        h2: "Lead Lists",
        body: [
          "Lead Lists help you organize selected leads by country, industry, campaign, client, or target market.",
          "Use Add to List from Search Results, Saved Leads, or Enrichment Results."
        ]
      },
      {
        h2: "Export organized lists",
        body: [
          "Open a lead list to review its records, remove irrelevant companies, and export the final list to Excel or CSV.",
          "Keeping separate lists makes follow-up and reporting much easier."
        ]
      }
    ],
    related: ["how-to-find-b2b-leads", "how-to-export-leads-to-excel", "b2b-lead-generation-best-practices"]
  },
  {
    slug: "b2b-lead-generation-best-practices",
    category: "Best Practices",
    title: "B2B Lead Generation Best Practices for Better Prospecting",
    description: "Improve B2B prospecting with focused ICPs, specific searches, lead quality review, deduplication, and responsible follow-up.",
    h1: "B2B Lead Generation Best Practices",
    sections: [
      {
        h2: "Define your ICP",
        body: [
          "Start with a clear ideal customer profile. Define company type, location, industry, size signals, and buying triggers.",
          "A precise ICP makes every search and enrichment job easier to review."
        ]
      },
      {
        h2: "Use specific criteria and review quality",
        body: [
          "Specific keywords and locations create cleaner lists than broad searches.",
          "Review lead scores, duplicate counts, and available contact fields before exporting."
        ]
      },
      {
        h2: "Export clean lists and follow up responsibly",
        body: [
          "Remove irrelevant records, organize qualified companies into lists, and export only the segments you plan to use.",
          "Respect local outreach rules and make your messaging relevant to the companies you contact."
        ]
      }
    ],
    related: ["how-to-find-b2b-leads", "how-to-build-b2b-lead-lists", "how-credits-work"]
  }
];

export const helpCategories = ["Getting Started", "Lead Search", "CSV Enrichment", "Credits & Billing", "Exporting", "Best Practices"];

export function getHelpArticle(slug: string) {
  return helpArticles.find((article) => article.slug === slug);
}
