import type { Metadata } from "next";

import { Hero } from "@/components/Hero";
import { ToolGrid } from "@/components/ToolGrid";
import { buildGlobalKeywords, DEFAULT_DESCRIPTION, SITE_NAME } from "@/lib/seo/brand";

export const metadata: Metadata = {
  title: "Free PDF, image & AI tools for India",
  description: DEFAULT_DESCRIPTION,
  keywords: buildGlobalKeywords().split(", "),
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE_NAME} — PDF, image & AI utilities`,
    description: DEFAULT_DESCRIPTION,
    url: "/",
  },
};

export default function Home() {
  return (
    <>
      <Hero />
      <ToolGrid />
    </>
  );
}
