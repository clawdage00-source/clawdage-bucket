"use client";

import { usePathname } from "next/navigation";

import { MobileStickyCta } from "@/components/MobileStickyCta";
import { RelatedToolsSection } from "@/components/RelatedToolsSection";
import { SocialProofBar } from "@/components/SocialProofBar";
import { TrustSection } from "@/components/TrustSection";

function slugFromPathname(pathname: string): string | null {
  const match = pathname.match(/^\/tools\/([^/]+)/);
  return match?.[1] ?? null;
}

export function ToolPageExtras() {
  const pathname = usePathname();
  const slug = slugFromPathname(pathname ?? "");

  if (!slug) {
    return null;
  }

  return (
    <>
      <div className="border-t border-border bg-muted/30 px-6 py-6">
        <SocialProofBar className="mx-auto max-w-3xl" />
      </div>
      <RelatedToolsSection slug={slug} />
      <TrustSection variant="compact" />
      <MobileStickyCta toolSlug={slug} />
    </>
  );
}
