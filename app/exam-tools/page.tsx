import type { Metadata } from "next";
import Link from "next/link";

import { ExamToolsJsonLd } from "@/components/JsonLd";
import { IndiaTrustBadges } from "@/components/india-trust-badges";
import { TrustSection } from "@/components/TrustSection";
import { SITE_NAME } from "@/lib/seo/brand";
import { EXAM_FAQS, EXAM_TOOLS } from "@/lib/seo/exam-tools";

export const metadata: Metadata = {
  title: "Government Exam Tools — SSC, UPSC, NEET, PSC Photo Resize",
  description:
    "Free exam utilities for Indian government applications: SSC, UPSC, NEET, Kerala PSC photos, signatures, and PDF compression — browser-first on Clawdage.",
  alternates: { canonical: "/exam-tools" },
};

export default function ExamToolsPage() {
  return (
    <>
      <ExamToolsJsonLd />
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-muted/40 px-6 py-14 sm:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#251EFF]">Exam utilities</p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Government exam tools for India
            </h1>
            <p className="mt-5 text-muted-foreground sm:text-lg">
              Resize photos, signatures, and PDFs for SSC, UPSC, NEET, state PSC, and railway forms — without sending
              files to random upload sites.
            </p>
            <IndiaTrustBadges className="mt-6 justify-center" />
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-6 py-12 sm:py-14">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {EXAM_TOOLS.map((item) => (
              <li key={item.slug}>
                <Link
                  href={item.href}
                  className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:border-[#251EFF]/40 hover:shadow-md"
                >
                  {item.badge ? (
                    <span className="mb-2 w-fit rounded-full bg-[#251EFF]/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-[#251EFF]">
                      {item.badge}
                    </span>
                  ) : null}
                  <h2 className="text-lg font-bold text-foreground group-hover:text-[#251EFF]">{item.title}</h2>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{item.description}</p>
                  <span className="mt-4 text-sm font-medium text-[#251EFF]">Open utility →</span>
                </Link>
              </li>
            ))}
          </ul>

          <section className="mt-16">
            <h2 className="text-2xl font-bold text-foreground">FAQs</h2>
            <dl className="mt-6 space-y-6">
              {EXAM_FAQS.map((f) => (
                <div key={f.question}>
                  <dt className="font-semibold text-foreground">{f.question}</dt>
                  <dd className="mt-2 text-sm text-muted-foreground">{f.answer}</dd>
                </div>
              ))}
            </dl>
          </section>

          <p className="mt-12 text-center text-sm text-muted-foreground">
            All tools on {SITE_NAME} —{" "}
            <Link href="/#tools" className="font-medium text-[#251EFF] hover:underline">
              browse full catalog
            </Link>
          </p>
        </div>

        <TrustSection variant="compact" />
      </div>
    </>
  );
}
