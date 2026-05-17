import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { COMPARISON_PAGES, getComparisonPage } from "@/lib/seo/comparisons";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return COMPARISON_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getComparisonPage(slug);
  if (!page) return { title: "Compare" };
  return {
    title: page.title,
    description: page.metaDescription,
    alternates: { canonical: `/compare/${slug}` },
  };
}

export default async function ComparePage({ params }: Props) {
  const { slug } = await params;
  const page = getComparisonPage(slug);
  if (!page) notFound();

  return (
    <article className="min-h-screen bg-background px-6 py-14">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-sm text-[#251EFF] hover:underline">
          ← Guides
        </Link>
        <h1 className="mt-6 text-3xl font-bold text-foreground">{page.title}</h1>
        <p className="mt-4 text-muted-foreground">{page.intro}</p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-bold text-foreground">{page.left.label}</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              {page.left.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </section>
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-bold text-foreground">{page.right.label}</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              {page.right.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </section>
        </div>

        <p className="mt-10 rounded-xl bg-muted/50 p-5 text-foreground">{page.verdict}</p>

        <h2 className="mt-10 text-lg font-bold">Try on Clawdage</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {page.toolLinks.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="rounded-full bg-[#251EFF] px-4 py-2 text-sm font-semibold text-white">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
