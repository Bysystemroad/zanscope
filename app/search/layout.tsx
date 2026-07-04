import type { Metadata } from "next";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = noIndexMetadata(
  "Zanscope Search",
  "Private Zanscope lead search workflow for authenticated users."
);

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
