"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { IndiaTrustBadges } from "@/components/india-trust-badges";
import { MobileStickyCta } from "@/components/MobileStickyCta";
import { RecentlyUsedTools } from "@/components/recently-used-tools";
import { SocialProofBar } from "@/components/SocialProofBar";
import { ToolPageSeo } from "@/components/tools/tool-page-seo";
import { TrustSection } from "@/components/TrustSection";
import { useRecentTools } from "@/hooks/use-recent-tools";

function slugFromPathname(pathname: string): string | null {
  const match = pathname.match(/^\/tools\/([^/]+)/);
  return match?.[1] ?? null;
}

export function ToolPageExtras() {
  const pathname = usePathname();
  const slug = slugFromPathname(pathname ?? "");
  const { recordVisit } = useRecentTools();

  useEffect(() => {
    if (slug) recordVisit(slug);
  }, [slug, recordVisit]);

  if (!slug) {
    return null;
  }

  return (
    <>
      <div className="border-t border-border bg-background px-6 py-4">
        <IndiaTrustBadges className="mx-auto max-w-3xl justify-center" compact />
      </div>
      <RecentlyUsedTools />
      <ToolPageSeo slug={slug} />
      <div className="border-t border-border bg-muted/30 px-6 py-6">
        <SocialProofBar className="mx-auto max-w-3xl" />
      </div>
      <TrustSection variant="compact" />
      <MobileStickyCta toolSlug={slug} />
    </>
  );
}
