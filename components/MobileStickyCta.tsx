"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { getToolBySlug } from "@/lib/tools-data";

type MobileStickyCtaProps = {
  toolSlug?: string;
  href?: string;
  label?: string;
};

export function MobileStickyCta({ toolSlug, href, label }: MobileStickyCtaProps) {
  const pathname = usePathname();
  const tool = toolSlug ? getToolBySlug(toolSlug) : null;
  const ctaHref = href ?? (tool ? `/tools/${tool.slug}` : "/pricing");
  const ctaLabel = label ?? (tool ? `Use ${tool.name}` : "₹19 Daily Pass");

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden"
      role="complementary"
      aria-label="Quick action"
    >
      <div className="mx-auto flex max-w-lg gap-2">
        <Link
          href="/#tools"
          className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground"
        >
          All tools
        </Link>
        <Link
          href={ctaHref}
          className="inline-flex min-h-[48px] flex-[1.2] items-center justify-center rounded-xl bg-[#251EFF] px-4 text-sm font-semibold text-white"
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}
