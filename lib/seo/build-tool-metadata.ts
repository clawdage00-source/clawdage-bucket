import type { Metadata } from "next";

import { SITE_NAME } from "@/lib/seo/brand";
import { getToolSeoEntry } from "@/lib/seo/tool-registry";
import { getToolBySlug } from "@/lib/tools-data";
import { getSiteOrigin } from "@/lib/supabase/site-url";

export async function buildToolMetadata(slug: string): Promise<Metadata> {
  const tool = getToolBySlug(slug);
  if (!tool) {
    return { title: "Tool" };
  }

  const seo = getToolSeoEntry(slug);
  const title = seo?.metaTitle ?? `${tool.name} | ${SITE_NAME}`;
  const description = seo?.metaDescription ?? tool.description;
  const keywordList = seo ? [...seo.keywords, tool.name, tool.slug.replace(/-/g, " ")] : [tool.name, tool.slug];

  const origin = await getSiteOrigin();
  const path = `/tools/${slug}`;
  const absoluteUrl = `${origin}${path}`;

  return {
    title,
    description,
    keywords: keywordList,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl,
      siteName: SITE_NAME,
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}
