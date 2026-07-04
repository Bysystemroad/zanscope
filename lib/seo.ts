import type { Metadata } from "next";

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zanscope.com";
export const siteName = "Zanscope";
export const defaultOgImage = {
  url: "/zanscope-logo.png",
  width: 1080,
  height: 608,
  alt: "Zanscope"
};

type SeoMetadataInput = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  noIndex?: boolean;
};

export function absoluteUrl(path = "/") {
  return new URL(path, siteUrl).toString();
}

export function createSeoMetadata({
  title,
  description,
  path = "/",
  keywords = [],
  noIndex = false
}: SeoMetadataInput): Metadata {
  const canonical = absoluteUrl(path);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName,
      type: "website",
      images: [defaultOgImage]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [defaultOgImage.url]
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false
          }
        }
      : {
          index: true,
          follow: true
        }
  };
}

export function noIndexMetadata(title: string, description: string): Metadata {
  return createSeoMetadata({ title, description, noIndex: true });
}
