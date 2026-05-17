"use client";

import Link from "next/link";

import { IndiaTrustBadges } from "@/components/india-trust-badges";
import { ToolExampleCard } from "@/components/tool-example-card";
import { SITE_NAME } from "@/lib/seo/brand";
import { getExamUtilityLinks, getRelatedBlogsForTool, getRelatedTools, getTrendingTools } from "@/lib/seo/internal-links";
import { getToolRichContent } from "@/lib/seo/tool-rich-content";
import { getToolBySlug } from "@/lib/tools-data";

type ToolPageSeoProps = {
  slug: string;
};

export function ToolPageSeo({ slug }: ToolPageSeoProps) {
  const tool = getToolBySlug(slug);
  const content = getToolRichContent(slug);
  if (!tool || !content) {
    return null;
  }

  const related = getRelatedTools(slug, 4);
  const blogs = getRelatedBlogsForTool(slug);
  const trending = getTrendingTools(slug, 3);
  const examLinks = getExamUtilityLinks().slice(0, 6);

  return (
    <article className="border-t border-border bg-muted/40" itemScope itemType="https://schema.org/SoftwareApplication">
      <meta itemProp="name" content={tool.name} />

      {/* Hero SEO block */}
      <header className="border-b border-border bg-background px-6 py-12 sm:py-14">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#251EFF]">Clawdage · India utilities</p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{tool.name}</h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">{content.heroSubheadline}</p>
          <IndiaTrustBadges className="mt-6 justify-center" compact />
          <Link
            href="/pricing"
            className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#251EFF] px-6 text-sm font-semibold text-white hover:opacity-90"
          >
            ₹19 Daily Pass — perfect for one-time government applications
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-12 sm:py-14">
        <section>
          <h3 className="text-xl font-bold text-foreground">Why you need {tool.name}</h3>
          <p className="mt-4 text-muted-foreground">{content.whyParagraph}</p>
        </section>

        <section className="mt-12">
          <h3 className="text-xl font-bold text-foreground">Popular use cases in India</h3>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">
            {content.useCases.map((u) => (
              <li key={u}>{u}</li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h3 className="text-xl font-bold text-foreground">Government &amp; exam applications</h3>
          <ul className="mt-4 space-y-3">
            {content.examUseCases.map(({ exam, detail }) => (
              <li key={exam} className="rounded-xl border border-border bg-card p-4">
                <p className="font-semibold text-foreground">{exam}</p>
                <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm">
            <Link href="/exam-tools" className="font-medium text-[#251EFF] hover:underline">
              Browse all exam utilities →
            </Link>
          </p>
        </section>

        <ToolExampleCard example={content.example} className="mt-12" />

        <section className="mt-12">
          <h3 className="text-xl font-bold text-foreground">How to use {tool.name} — step by step</h3>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-muted-foreground">
            {content.howToSteps.map((step, i) => (
              <li key={i} className="pl-1">
                {step}
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-12">
          <h3 className="text-xl font-bold text-foreground">Mobile tutorial</h3>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            {content.mobileTutorial.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </section>

        <section className="mt-12">
          <h3 className="text-xl font-bold text-foreground">Benefits</h3>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {content.benefits.map((b) => (
              <li key={b} className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground">
                {b}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h3 className="text-xl font-bold text-foreground">Supported formats</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {content.supportedFormats.map((f) => (
              <span key={f} className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium">
                {f}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h3 className="text-xl font-bold text-foreground">{content.targetHeading}</h3>
          <p className="mt-4 text-muted-foreground">{content.targetBody}</p>
        </section>

        <section className="mt-12 rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-bold text-foreground">Privacy-first processing</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {SITE_NAME} is built for Indian applicants who cannot risk uploading Aadhaar, marksheets, or signed PDFs to
            random file hosts. When this tool runs fully in your browser, your bytes stay on your device. Cloud-assisted
            Pro steps are labeled inside the tool — read the banner before processing sensitive documents.
          </p>
        </section>

        <section className="mt-12">
          <h3 className="text-xl font-bold text-foreground">Frequently asked questions</h3>
          <dl className="mt-4 space-y-6">
            {content.faqs.map((f) => (
              <div key={f.question}>
                <dt className="font-semibold text-foreground">{f.question}</dt>
                <dd className="mt-2 text-sm text-muted-foreground">{f.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        {related.length > 0 ? (
          <section className="mt-14">
            <h3 className="text-xl font-bold text-foreground">Related tools</h3>
            <ul className="mt-4 space-y-2">
              {related.map((t) => (
                <li key={t.slug}>
                  <Link href={`/tools/${t.slug}`} className="text-sm font-medium text-[#251EFF] hover:underline">
                    {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {trending.length > 0 ? (
          <section className="mt-10">
            <h3 className="text-lg font-bold text-foreground">Trending on Clawdage</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {trending.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={`/tools/${t.slug}`}
                    className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium hover:border-[#251EFF]/40"
                  >
                    {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {blogs.length > 0 ? (
          <section className="mt-10">
            <h3 className="text-lg font-bold text-foreground">Related guides</h3>
            <ul className="mt-3 space-y-2">
              {blogs.map((b) => (
                <li key={b.slug}>
                  <Link href={`/blog/${b.slug}`} className="text-sm text-[#251EFF] hover:underline">
                    {b.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {examLinks.length > 0 ? (
          <section className="mt-10">
            <h3 className="text-lg font-bold text-foreground">Exam utility pages</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {examLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-xs font-medium text-[#251EFF] hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </article>
  );
}
