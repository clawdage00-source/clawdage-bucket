import type { Metadata } from "next";

import { SITE_NAME } from "@/lib/seo/brand";
import { getLandingPage } from "@/lib/seo/landing-pages";
import { getSiteOrigin } from "@/lib/supabase/site-url";

export async function buildLandingMetadata(slug: string): Promise<Metadata> {
  const page = getLandingPage(slug);
  if (!page) {
    return { title: "Utility" };
  }

  const path = `/${slug}`;
  const origin = await getSiteOrigin();

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    keywords: page.keywords,
    alternates: { canonical: path },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: `${origin}${path}`,
      siteName: SITE_NAME,
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: page.metaTitle,
      description: page.metaDescription,
    },
    robots: { index: true, follow: true },
  };
}
