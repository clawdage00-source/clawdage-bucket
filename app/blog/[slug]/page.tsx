import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BlogPostJsonLd } from "@/components/JsonLd";
import { TrustSection } from "@/components/TrustSection";
import { getAllBlogPosts, getBlogPost } from "@/lib/blog/posts";
import { SITE_NAME } from "@/lib/seo/brand";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllBlogPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: "Article" };
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.publishedAt,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  return (
    <>
      <BlogPostJsonLd post={post} />
      <article className="min-h-screen bg-background pb-20">
        <header className="border-b border-border bg-muted/40 px-6 py-12 sm:py-14">
          <div className="mx-auto max-w-3xl">
            <Link href="/blog" className="text-sm font-medium text-[#251EFF] hover:underline">
              ← All guides
            </Link>
            <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-[#251EFF]">{post.category}</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{post.title}</h1>
            <p className="mt-4 text-muted-foreground">{post.description}</p>
            <p className="mt-4 text-xs text-muted-foreground">
              {post.publishedAt} · {post.readMinutes} min read
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-6 py-12">
          {post.sections.map((section, i) => (
            <section key={i} className="mt-10 first:mt-0">
              {section.heading ? (
                <h2 className="text-xl font-bold text-foreground">{section.heading}</h2>
              ) : null}
              <div className="mt-4 space-y-4">
                {section.paragraphs.map((p, j) => (
                  <p key={j} className="text-base leading-relaxed text-muted-foreground">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}

          {post.relatedToolSlugs.length > 0 ? (
            <div className="mt-14 rounded-2xl border border-border bg-[#251EFF]/5 p-6">
              <h2 className="text-lg font-bold text-foreground">Try on {SITE_NAME}</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {post.relatedToolSlugs.map((toolSlug) => (
                  <li key={toolSlug}>
                    <Link
                      href={`/tools/${toolSlug}`}
                      className="inline-flex rounded-full bg-[#251EFF] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                    >
                      Open {toolSlug.replace(/-/g, " ")}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <h2 className="mt-14 text-xl font-bold text-foreground">FAQ</h2>
          <dl className="mt-6 space-y-6">
            {post.faqs.map((f) => (
              <div key={f.question}>
                <dt className="font-semibold text-foreground">{f.question}</dt>
                <dd className="mt-2 text-sm text-muted-foreground">{f.answer}</dd>
              </div>
            ))}
          </dl>
        </div>

        <TrustSection variant="compact" />
      </article>
    </>
  );
}
