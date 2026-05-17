import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { LandingPageJsonLd } from "@/components/JsonLd";
import { RelatedToolsSection } from "@/components/RelatedToolsSection";
import { TrustSection } from "@/components/TrustSection";
import { getLandingPage, type SeoLandingPage } from "@/lib/seo/landing-pages";
import { getToolBySlug } from "@/lib/tools-data";

type SeoLandingPageViewProps = {
  page: SeoLandingPage;
};

export function SeoLandingPageView({ page }: SeoLandingPageViewProps) {
  const tool = getToolBySlug(page.toolSlug);

  return (
    <>
      <LandingPageJsonLd page={page} />
      <article className="min-h-screen bg-background pb-24 md:pb-0">
        <header className="border-b border-border bg-muted/40 px-6 py-14 sm:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Clawdage · India utilities
            </p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{page.headline}</h1>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">{page.subheadline}</p>
            {tool ? (
              <Link
                href={`/tools/${page.toolSlug}`}
                className="mt-8 inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-[#251EFF] px-8 text-sm font-semibold text-white shadow-lg shadow-[#251EFF]/20 transition hover:opacity-90"
              >
                {page.toolCtaLabel}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            ) : null}
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-6 py-12 sm:py-14">
          {page.sections.map((section) => (
            <section key={section.heading} className="mt-10 first:mt-0">
              <h2 className="text-xl font-bold text-foreground sm:text-2xl">{section.heading}</h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">{section.body}</p>
            </section>
          ))}

          <h2 className="mt-14 text-xl font-bold text-foreground">Frequently asked questions</h2>
          <dl className="mt-6 space-y-6">
            {page.faqs.map((f) => (
              <div key={f.question}>
                <dt className="font-semibold text-foreground">{f.question}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.answer}</dd>
              </div>
            ))}
          </dl>

          {page.relatedLandingSlugs.length > 0 ? (
            <nav className="mt-14 rounded-2xl border border-border bg-muted/50 p-6" aria-label="Related utilities">
              <h2 className="text-lg font-bold text-foreground">Related guides</h2>
              <ul className="mt-4 space-y-2">
                {page.relatedLandingSlugs.map((s) => {
                  const related = getLandingPage(s);
                  return (
                    <li key={s}>
                      <Link href={`/${s}`} className="text-sm font-medium text-[#251EFF] hover:underline">
                        {related?.headline ?? s.replace(/-/g, " ")}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          ) : null}
        </div>

        <RelatedToolsSection slug={page.toolSlug} showExamLinks />
        <TrustSection variant="compact" />
      </article>
    </>
  );
}
