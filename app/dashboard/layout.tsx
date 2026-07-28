import type { Metadata } from "next";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = noIndexMetadata(
  "Zanscope Dashboard",
  "Private Zanscope workspace for saved leads, search history, lists, enrichment, and account data."
);

export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
