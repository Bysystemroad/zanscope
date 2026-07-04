import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { helpArticles } from "@/lib/help-content";

const publicPaths = ["/", "/help", ...helpArticles.map((article) => `/help/${article.slug}`)];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return publicPaths.map((path) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/help" ? 0.8 : 0.7
  }));
}
