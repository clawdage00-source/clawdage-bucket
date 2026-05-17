"use client";

import Link from "next/link";
import { Clock, Star } from "lucide-react";

import { useRecentTools } from "@/hooks/use-recent-tools";

type RecentlyUsedToolsProps = {
  onNavigate?: (slug: string) => void;
  className?: string;
};

export function RecentlyUsedTools({ onNavigate, className = "" }: RecentlyUsedToolsProps) {
  const { recent, favorites } = useRecentTools();

  if (!recent.length && !favorites.length) {
    return null;
  }

  return (
    <section className={`border-b border-border bg-muted/30 px-6 py-8 ${className}`} aria-labelledby="recent-tools-heading">
      <div className="mx-auto max-w-6xl">
        {recent.length > 0 ? (
          <>
            <h2 id="recent-tools-heading" className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Clock className="h-4 w-4 text-[#251EFF]" aria-hidden />
              Continue working
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {recent.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={`/tools/${t.slug}`}
                    onClick={() => onNavigate?.(t.slug)}
                    className="inline-flex rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-[#251EFF]/40"
                  >
                    {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {favorites.length > 0 ? (
          <div className={recent.length ? "mt-6" : ""}>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Star className="h-4 w-4 text-[#251EFF]" aria-hidden />
              Quick access
            </h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {favorites.map((slug) => (
                <li key={slug}>
                  <Link
                    href={`/tools/${slug}`}
                    className="inline-flex rounded-full border border-[#251EFF]/30 bg-[#251EFF]/5 px-3 py-1.5 text-xs font-medium text-[#251EFF]"
                  >
                    {slug.replace(/-/g, " ")}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
