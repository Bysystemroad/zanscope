"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Database,
  Download,
  FileSpreadsheet,
  MailSearch,
  Radar,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 }
};

const howItWorks = [
  ["Upload or search", "Start from a market search or upload your own company CSV."],
  ["Discover companies", "Identify relevant businesses, websites, and market-fit company records."],
  ["Enrich contact data", "Fill in emails, phone numbers, addresses, and lead quality scores."],
  ["Export ready-to-use leads", "Download clean Excel or CSV files or save leads into organized lists."]
];

const features: Array<[string, LucideIcon]> = [
  ["Verified business lead discovery", Database],
  ["Automated contact enrichment", MailSearch],
  ["Advanced company matching", ShieldCheck],
  ["Excel and CSV export", Download],
  ["Credit-based usage", Zap],
  ["Send to Zantevo", Sparkles]
];

const listEnrichmentBullets = [
  "Upload your own CSV",
  "Match company columns",
  "Fill missing websites and contact data",
  "Export enriched results to Excel or CSV",
  "Save enriched leads into lists"
];

const productPreviewRows = [
  ["Northstar Automation", "northstar.example", "sales@northstar.example", "+1 512 555 0148", "92", "Enriched"],
  ["LatticeOps", "latticeops.example", "hello@latticeops.example", "+1 512 555 0199", "88", "Enriched"],
  ["Clearpath Systems", "clearpath.example", "contact@clearpath.example", "+1 512 555 0182", "84", "Enriched"]
];

const metrics = [
  ["Built for fast B2B prospecting", "Move from market idea to structured prospect list without spreadsheet cleanup."],
  ["Enrichment-ready lead workflows", "Search new markets or upload existing company records for enrichment."],
  ["Excel and CSV export", "Download clean files your sales, export, or agency team can use immediately."],
  ["Saved lists and search history", "Keep market research, lead lists, and exports organized in your account."]
];

const beforeAfter: Array<[string, string[]]> = [
  ["Before", ["Company Name", "Country", "City"]],
  ["After", ["Website", "Email", "Phone", "Address", "Lead Quality Score", "Export-ready Excel"]]
];

const useCases = [
  ["Export Managers", "Find distributors, manufacturers and buyers in new markets."],
  ["B2B Sales Teams", "Build targeted lead lists and enrich company contact data."],
  ["Lead Generation Agencies", "Create cleaner prospect databases for clients faster."],
  ["Founders", "Find early customers and organize outreach-ready prospects."]
];

const plans = [
  ["Starter", "For focused prospecting tests", "100 starter credits"],
  ["Growth", "For weekly outbound campaigns", "3,000 credits"],
  ["Business", "For teams and agencies", "Custom credits"]
];

const trustBullets = [
  "Your saved searches and lead lists stay in your account.",
  "Export-ready results with structured company data.",
  "No provider names or technical implementation details shown to users.",
  "Designed for B2B prospecting and market research."
];

const faqs = [
  [
    "What is a credit?",
    "A credit is used when Zanscope processes or enriches a company record. Email enrichment may require an additional credit."
  ],
  [
    "Can I upload my own CSV?",
    "Yes. You can upload a company list and enrich it with websites, emails, phones, addresses and quality scores."
  ],
  ["Can I export results?", "Yes. You can export results to Excel or CSV."],
  [
    "Is Zanscope only for new lead searches?",
    "No. You can also enrich existing company lists and organize leads into saved lists."
  ],
  [
    "Do you show how the data is collected?",
    "No. Zanscope presents clean business intelligence results without exposing internal provider details."
  ]
];

function RadarVisual() {
  return (
    <div className="premium-border relative mx-auto aspect-square w-full max-w-[520px] overflow-hidden rounded-[2rem] bg-[#11161d] p-6 shadow-[0_0_80px_rgba(255,255,255,0.08)]">
      <div className="radar-grid absolute inset-0 opacity-60" />
      <div className="absolute inset-10 rounded-full border border-white/10" />
      <div className="absolute inset-20 rounded-full border border-white/10" />
      <div className="absolute inset-32 rounded-full border border-white/10" />
      <div className="animate-radar absolute left-1/2 top-1/2 h-[46%] w-px origin-bottom bg-gradient-to-t from-white/70 to-transparent" />
      <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_38px_rgba(255,255,255,0.45)]" />
      {[
        ["top-[22%] left-[28%]", "Berlin", "31"],
        ["top-[38%] right-[18%]", "Austin", "48"],
        ["bottom-[24%] left-[22%]", "London", "27"]
      ].map(([position, city, count]) => (
        <div key={city} className={`animate-float-card glass-panel absolute ${position} rounded-xl px-3 py-2 text-xs`}>
          <div className="font-semibold text-white">{city}</div>
          <div className="text-muted-foreground">{count} leads</div>
        </div>
      ))}
      <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Signal confidence</span>
          <span className="text-[#d8e0e8]">94%</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[94%] rounded-full bg-gradient-to-r from-white to-[#a7b0b8]" />
        </div>
      </div>
    </div>
  );
}

function ProductPreview() {
  return (
    <div className="premium-border mx-auto max-w-7xl rounded-[2rem]">
      <div className="glass-panel overflow-hidden rounded-[2rem]">
        <div className="flex flex-col gap-4 border-b border-white/8 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-semibold text-white">B2B lead workspace</div>
            <div className="mt-1 text-xs text-muted-foreground">Company table, enrichment fields, lead score, and export actions</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-white/6 text-xs uppercase text-muted-foreground">
              <tr>
                {["Company", "Website", "Email", "Phone", "Lead Score", "Status"].map((heading) => (
                  <th key={heading} className="px-5 py-4">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {productPreviewRows.map((row) => (
                <tr key={row[0]} className="hover:bg-white/5">
                  <td className="px-5 py-4 font-medium text-white">{row[0]}</td>
                  <td className="px-5 py-4 text-[#d8e0e8]">{row[1]}</td>
                  <td className="px-5 py-4">{row[2]}</td>
                  <td className="px-5 py-4 text-[#d8e0e8]">{row[3]}</td>
                  <td className="px-5 py-4">{row[4]}</td>
                  <td className="px-5 py-4 text-white">{row[5]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-white/8 px-5 py-3 text-xs text-muted-foreground">Sample lead data shown for preview.</div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="overflow-hidden">
      <section className="relative min-h-[calc(100vh-5rem)] border-b border-white/8">
        <div className="absolute inset-0 surface-grid opacity-60" />
        <div className="absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8 lg:py-24">
          <motion.div initial="hidden" animate="visible" transition={{ staggerChildren: 0.12 }} className="flex flex-col justify-center">
            <motion.div variants={fadeUp} className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white">
              <Target className="h-4 w-4" />
              AI targeting and B2B data intelligence
            </motion.div>
            <motion.h1 variants={fadeUp} className="max-w-4xl text-5xl font-semibold leading-tight tracking-normal text-white sm:text-7xl">
              Find Companies. Enrich Contacts. Export Ready-to-Use Leads.
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Build high-quality B2B prospect lists in minutes instead of hours. Zanscope helps you discover companies, enrich contact data, score lead quality, remove duplicates, and export clean Excel or CSV files.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/login">
                <Button className="h-12 px-6">
                  <Search className="h-4 w-4" />
                  Start free with 100 credits
                </Button>
              </Link>
              <Link href="/search/results?demo=true">
                <Button variant="outline" className="h-12 px-6">
                  View product demo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}>
            <RadarVisual />
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp}>
          <ProductPreview />
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-semibold uppercase text-[#d8e0e8]">How it works</p>
          <h2 className="mt-3 text-4xl font-semibold text-white">From raw market idea to export-ready leads.</h2>
        </div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} transition={{ staggerChildren: 0.08 }} className="grid gap-4 md:grid-cols-4">
          {howItWorks.map(([title, copy], index) => (
            <motion.div key={title} variants={fadeUp} className="glass-panel rounded-2xl p-5 transition hover:-translate-y-1 hover:border-white/20">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-white/8 text-white">{index + 1}</div>
              <h2 className="font-semibold text-white">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{copy}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="border-y border-white/8 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-4">
            {metrics.map(([title, copy]) => (
              <div key={title} className="glass-panel rounded-2xl p-5">
                <div className="text-sm font-semibold text-white">{title}</div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp}>
          <p className="text-sm font-semibold uppercase text-[#d8e0e8]">List Enrichment</p>
          <h2 className="mt-3 text-4xl font-semibold text-white">Enrich your existing company lists</h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            Upload a CSV with company names, websites, countries or cities. Zanscope enriches each record with websites, emails, phone numbers, addresses and lead quality scores.
          </p>
          <Link href="/dashboard/enrich" className="mt-7 inline-flex">
            <Button variant="outline" className="h-11 px-5">
              <FileSpreadsheet className="h-4 w-4" />
              Enrich a list
            </Button>
          </Link>
        </motion.div>
        <div className="premium-border rounded-3xl">
          <div className="glass-panel rounded-3xl p-6">
            <div className="mb-5 flex items-center justify-between border-b border-white/8 pb-4">
              <div>
                <div className="text-sm font-semibold text-white">CSV upload workflow</div>
                <div className="text-xs text-muted-foreground">Map, enrich, score, export</div>
              </div>
              <FileSpreadsheet className="h-5 w-5 text-[#d8e0e8]" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {listEnrichmentBullets.map((item) => (
                <div key={item} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <Check className="h-4 w-4 text-[#d8e0e8]" />
                  <div className="mt-3 text-sm font-medium text-white">{item}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/8 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-semibold uppercase text-[#d8e0e8]">Core features</p>
            <h2 className="mt-3 text-4xl font-semibold text-white">A prospecting engine built for clean data.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {features.map(([title, Icon]) => (
              <motion.div key={String(title)} whileHover={{ y: -5 }} className="glass-panel rounded-2xl p-5">
                <Icon className="h-5 w-5 text-[#d8e0e8]" />
                <h3 className="mt-5 font-semibold text-white">{title}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase text-[#d8e0e8]">Before / After</p>
          <h2 className="mt-3 text-4xl font-semibold text-white">Turn sparse company rows into outreach-ready records.</h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            Zanscope starts with basic company inputs, enriches the missing fields, scores each record, and prepares a clean Excel file your team can use immediately.
          </p>
        </div>
        <div className="premium-border rounded-3xl">
          <div className="glass-panel rounded-3xl p-6">
            <div className="grid gap-4 md:grid-cols-2">
              {beforeAfter.map(([title, fields]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <div className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#d8e0e8]">{title}</div>
                  <div className="space-y-3">
                    {fields.map((field) => (
                      <div key={field} className="flex items-center justify-between rounded-xl border border-white/10 bg-[#07111f] px-3 py-2 text-sm">
                        <span className="text-muted-foreground">{field}</span>
                        <span className="text-white">{title === "Before" ? "Input" : "Enriched"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-4">
          {useCases.map(([useCase, copy]) => (
            <div key={useCase} className="glass-panel rounded-2xl p-5">
              <Check className="h-5 w-5 text-[#d8e0e8]" />
              <h3 className="mt-4 font-semibold text-white">{useCase}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-white/8 bg-white/[0.02]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase text-[#d8e0e8]">Trust and privacy</p>
            <h2 className="mt-3 text-4xl font-semibold text-white">Built for clean and private lead workflows</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {trustBullets.map((bullet) => (
              <div key={bullet} className="glass-panel rounded-2xl p-5">
                <ShieldCheck className="h-5 w-5 text-[#d8e0e8]" />
                <p className="mt-4 text-sm leading-6 text-muted-foreground">{bullet}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/8 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase text-[#d8e0e8]">Pricing preview</p>
            <h2 className="mt-3 text-4xl font-semibold text-white">Credits that scale with discovery.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map(([name, copy, credits]) => (
              <div key={name} className="glass-panel rounded-2xl p-6 transition hover:-translate-y-1 hover:border-white/20">
                <h3 className="text-xl font-semibold text-white">{name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{copy}</p>
                <div className="mt-6 text-3xl font-semibold text-white">{credits}</div>
                <Button className="mt-6 w-full" variant={name === "Growth" ? "primary" : "outline"}>Coming soon</Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase text-[#d8e0e8]">FAQ</p>
          <h2 className="mt-3 text-4xl font-semibold text-white">Questions before you start?</h2>
        </div>
        <div className="grid gap-4">
          {faqs.map(([question, answer]) => (
            <div key={question} className="glass-panel rounded-2xl p-5">
              <h3 className="font-semibold text-white">{question}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-20 text-center sm:px-6 lg:px-8">
        <div className="premium-border rounded-3xl">
          <div className="glass-panel rounded-3xl p-10">
            <Radar className="mx-auto h-10 w-10 text-[#d8e0e8]" />
            <h2 className="mt-5 text-4xl font-semibold text-white">Start finding sharper B2B opportunities.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">Launch a search or enrich your own CSV, then export a clean lead list to Excel or CSV.</p>
            <Link href="/login" className="mt-7 inline-flex">
              <Button className="h-12 px-6">
                Start free with 100 credits
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 text-sm text-muted-foreground sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <div className="font-semibold text-white">Zanscope</div>
            <div className="mt-1">© 2026 Zanscope. All rights reserved.</div>
          </div>
          <div className="flex flex-wrap gap-4">
            <a href="#" className="hover:text-white">Product</a>
            <a href="#" className="hover:text-white">Solutions</a>
            <Link href="/billing" className="hover:text-white">Pricing</Link>
            <a href="#" className="hover:text-white">Roadmap</a>
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
            <a href="mailto:contact@zanscope.com" className="hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

