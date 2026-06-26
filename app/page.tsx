"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Check,
  Database,
  Download,
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
import { leads } from "@/lib/dummy-data";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 }
};

const howItWorks = [
  ["Search market", "Enter keyword, city, country, and industry to define the exact market segment."],
  ["Discover companies", "Zanscope Intelligence identifies relevant businesses with websites, addresses, and phone signals."],
  ["Extract emails", "Automated contact enrichment checks websites and contact pages for business email addresses."],
  ["Export leads", "Deduplicated lists stay clean and ready for CSV export or Zantevo handoff."]
];

const features: Array<[string, LucideIcon]> = [
  ["Verified business lead discovery", Database],
  ["Automated contact enrichment", MailSearch],
  ["Advanced company matching", ShieldCheck],
  ["CSV export", Download],
  ["Credit-based usage", Zap],
  ["Send to Zantevo", Sparkles]
];

const useCases = ["Export managers", "B2B sales teams", "Lead generation agencies", "Founders"];

const plans = [
  ["Starter", "For focused prospecting tests", "500 credits"],
  ["Pro", "For weekly outbound campaigns", "3,000 credits"],
  ["Business", "For teams and agencies", "Custom credits"]
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
              Find B2B leads before your competitors do.
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Zanscope discovers companies, websites, phone numbers, emails, addresses, removes duplicates, and exports clean lead lists to CSV.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/search/new">
                <Button className="h-12 px-6">
                  <Search className="h-4 w-4" />
                  Start Searching
                </Button>
              </Link>
              <Link href="/search/results?demo=true">
                <Button variant="outline" className="h-12 px-6">
                  View Demo
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

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
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
          <p className="text-sm font-semibold uppercase text-[#d8e0e8]">Product preview</p>
          <h2 className="mt-3 text-4xl font-semibold text-white">From search to export in one control center.</h2>
          <p className="mt-4 leading-7 text-muted-foreground">Review enrichment status, duplicates, credit usage, and CSV output from one premium data workspace.</p>
        </div>
        <div className="premium-border rounded-3xl">
          <div className="glass-panel overflow-hidden rounded-3xl">
            <div className="flex items-center justify-between border-b border-white/8 p-4">
              <div>
                <div className="text-sm font-semibold text-white">Austin software companies</div>
                <div className="text-xs text-muted-foreground">Zanscope Intelligence + contact enrichment</div>
              </div>
              <Button variant="outline">
                <Download className="h-4 w-4" />
                CSV
              </Button>
            </div>
            <div className="divide-y divide-white/10">
              {leads.slice(0, 4).map((lead) => (
                <div key={lead.id} className="grid gap-4 p-4 md:grid-cols-[1fr_180px_110px]">
                  <div>
                    <div className="font-medium text-white">{lead.company_name}</div>
                    <div className="mt-1 text-sm text-white">{lead.email}</div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    {lead.city}
                  </div>
                  <div className="rounded-md border border-white/10 bg-white/6 px-2 py-1 text-center text-xs text-white">found</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-4">
          {useCases.map((useCase) => (
            <div key={useCase} className="glass-panel rounded-2xl p-5">
              <Check className="h-5 w-5 text-[#d8e0e8]" />
              <h3 className="mt-4 font-semibold text-white">{useCase}</h3>
            </div>
          ))}
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
                <Button className="mt-6 w-full" variant={name === "Pro" ? "primary" : "outline"}>Choose {name}</Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="premium-border rounded-3xl">
          <div className="glass-panel rounded-3xl p-10">
            <Radar className="mx-auto h-10 w-10 text-[#d8e0e8]" />
            <h2 className="mt-5 text-4xl font-semibold text-white">Start finding sharper B2B opportunities.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">Launch a search, discover companies, extract emails, remove duplicates, and export your next lead list.</p>
            <Link href="/search/new" className="mt-7 inline-flex">
              <Button className="h-12 px-6">
                Start Searching
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

