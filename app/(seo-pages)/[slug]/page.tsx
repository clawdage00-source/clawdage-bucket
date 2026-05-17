import { notFound } from "next/navigation";

import { SeoLandingPageView } from "@/components/seo/seo-landing-page";
import { buildLandingMetadata } from "@/lib/seo/build-landing-metadata";
import { getAllLandingSlugs, getLandingPage } from "@/lib/seo/landing-pages";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllLandingSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return buildLandingMetadata(slug);
}

export default async function SeoLandingRoute({ params }: PageProps) {
  const { slug } = await params;
  const page = getLandingPage(slug);
  if (!page) {
    notFound();
  }
  return <SeoLandingPageView page={page} />;
}
