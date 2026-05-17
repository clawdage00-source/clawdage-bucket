import type { Metadata } from "next";

import { AboutUs } from "@/components/AboutUs";
import { Hero } from "@/components/Hero";
import { SocialProofBar } from "@/components/SocialProofBar";
import { ToolGrid } from "@/components/ToolGrid";
import { TrustSection } from "@/components/TrustSection";
import { WhyClawdage } from "@/components/WhyClawdage";
import { buildGlobalKeywords, DEFAULT_DESCRIPTION, SITE_NAME } from "@/lib/seo/brand";

export const metadata: Metadata = {
  title: "India's Daily Digital Utility Platform",
  description: DEFAULT_DESCRIPTION,
  keywords: buildGlobalKeywords().split(", "),
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE_NAME} — India's Daily Digital Utility Platform`,
    description: DEFAULT_DESCRIPTION,
    url: "/",
  },
};

export default function Home() {
  return (
    <>
      <Hero />
      <div className="border-b border-border bg-background px-6 py-8">
        <SocialProofBar className="mx-auto max-w-3xl" />
      </div>
      <ToolGrid />
      <WhyClawdage />
      <TrustSection />
      <AboutUs />
    </>
  );
}
