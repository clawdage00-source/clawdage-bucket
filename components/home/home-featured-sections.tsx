import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp } from "lucide-react";

import { IndiaTrustBadges } from "@/components/india-trust-badges";
import { PlatformStats } from "@/components/platform-stats";
import { EXAM_TOOLS } from "@/lib/seo/exam-tools";
import { getExamSeasonTools, getTrendingTools } from "@/lib/seo/trending-tools";
import { MVP_TOOLS, NEW_TOOL_SLUGS } from "@/lib/tools-data";

export function HomeFeaturedSections() {
  const trending = getTrendingTools(undefined, 6);
  const examSeason = getExamSeasonTools(5);
  const featuredTools = MVP_TOOLS.filter((t) =>
    ["id-resizer", "passport-photo", "compress-pdf", "e-sign", "image-compressor"].includes(t.slug),
  );

  const newTools = MVP_TOOLS.filter((t) => NEW_TOOL_SLUGS.includes(t.slug as (typeof NEW_TOOL_SLUGS)[number]));

  return (
    <>
      <section className="border-b border-border bg-emerald-50/40 px-6 py-12 sm:py-14">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                New tools
              </p>
              <h2 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">Fresh PDF & business utilities</h2>
              <p className="mt-2 max-w-xl text-muted-foreground">
                Unlock PDFs, split pages, GST invoices, bank statements to Excel, signatures, and WhatsApp links — all in your browser.
              </p>
            </div>
          </div>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {newTools.map((tool) => (
              <li key={tool.slug}>
                <Link
                  href={`/tools/${tool.slug}`}
                  className="group flex flex-col rounded-2xl border border-emerald-200/80 bg-card p-5 transition hover:border-emerald-400/60 hover:shadow-md"
                >
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-foreground group-hover:text-emerald-800">{tool.name}</span>
                    <span className="rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                      New
                    </span>
                  </span>
                  <span className="mt-1 text-sm text-muted-foreground">{tool.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-border bg-background px-6 py-14 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#251EFF]">Featured</p>
              <h2 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">Built for Indian applicants</h2>
              <p className="mt-2 max-w-xl text-muted-foreground">
                Aadhaar resize, passport photos, PDF compression, and self-attestation — not generic AI demos.
              </p>
            </div>
            <IndiaTrustBadges compact />
          </div>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featuredTools.map((tool) => (
              <li key={tool.slug}>
                <Link
                  href={`/tools/${tool.slug}`}
                  className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition hover:border-[#251EFF]/40 hover:shadow-md"
                >
                  <span className="font-semibold text-foreground group-hover:text-[#251EFF]">{tool.name}</span>
                  <span className="mt-1 text-sm text-muted-foreground">{tool.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-border bg-muted/40 px-6 py-14 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#251EFF]" aria-hidden />
            <h2 className="text-2xl font-bold text-foreground">Trending tools</h2>
          </div>
          <p className="mt-2 text-muted-foreground">Most used for exam season and government uploads today.</p>
          <ul className="mt-8 flex flex-wrap gap-2">
            {trending.map((t) => (
              <li key={t.slug}>
                <Link
                  href={`/tools/${t.slug}`}
                  className="inline-flex rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:border-[#251EFF]/40"
                >
                  {t.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-border bg-background px-6 py-14 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Exam season utilities</h2>
              <p className="mt-2 text-muted-foreground">SSC, UPSC, NEET, PSC, and railway — one hub for form deadlines.</p>
            </div>
            <Link
              href="/exam-tools"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#251EFF] hover:underline"
            >
              View all exam tools
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {EXAM_TOOLS.slice(0, 4).map((e) => (
              <li key={e.slug}>
                <Link
                  href={e.href}
                  className="block rounded-xl border border-border bg-card p-4 text-sm font-medium hover:border-[#251EFF]/40"
                >
                  {e.title}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="mt-4 flex flex-wrap gap-2">
            {examSeason.map((t) => (
              <li key={t.slug}>
                <Link href={`/tools/${t.slug}`} className="text-xs text-muted-foreground hover:text-[#251EFF]">
                  {t.name} →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-border bg-muted/30 px-6 py-10">
        <PlatformStats className="mx-auto max-w-4xl" />
      </section>
    </>
  );
}
