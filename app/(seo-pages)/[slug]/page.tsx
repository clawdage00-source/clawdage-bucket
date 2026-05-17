import { notFound } from "next/navigation";

import { SeoLandingPageView } from "@/components/seo/seo-landing-page";
import { buildLandingMetadata } from "@/lib/seo/build-landing-metadata";
import { getAllSeoPageSlugs, getSeoPageBySlug } from "@/lib/seo/programmatic-pages";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllSeoPageSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return buildLandingMetadata(slug);
}

export default async function SeoLandingRoute({ params }: PageProps) {
  const { slug } = await params;
  const page = getSeoPageBySlug(slug);
  if (!page) {
    notFound();
  }
  return <SeoLandingPageView page={page} />;
}
