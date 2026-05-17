import type { Metadata } from "next";
import Link from "next/link";

import { TrustSection } from "@/components/TrustSection";
import { getAllBlogPosts, type BlogCategory } from "@/lib/blog/posts";
import { SITE_NAME } from "@/lib/seo/brand";

export const metadata: Metadata = {
  title: "Guides for Indian exams, PDFs & ID photos",
  description:
    "Clawdage blog: Aadhaar resize, passport photos, SSC signatures, NEET uploads, and PDF compression for government portals in India.",
  alternates: { canonical: "/blog" },
};

const CATEGORIES: BlogCategory[] = [
  "Government Exams",
  "PDF Guides",
  "Passport Photos",
  "Aadhaar Utilities",
  "File Compression",
  "Student Tools",
];

export default function BlogIndexPage() {
  const posts = getAllBlogPosts().sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-muted/40 px-6 py-14 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {SITE_NAME} Guides
          </h1>
          <p className="mt-4 text-muted-foreground">
            Practical tutorials for Indian students, exam applicants, and office users.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <span
              key={cat}
              className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              {cat}
            </span>
          ))}
        </div>

        <ul className="mt-10 space-y-8">
          {posts.map((post) => (
            <li key={post.slug} className="border-b border-border pb-8 last:border-0">
              <p className="text-xs font-medium uppercase tracking-wide text-[#251EFF]">{post.category}</p>
              <Link href={`/blog/${post.slug}`} className="mt-2 block group">
                <h2 className="text-xl font-bold text-foreground group-hover:text-[#251EFF] sm:text-2xl">
                  {post.title}
                </h2>
              </Link>
              <p className="mt-2 text-sm text-muted-foreground">{post.description}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                {post.publishedAt} · {post.readMinutes} min read
              </p>
            </li>
          ))}
        </ul>
      </div>

      <TrustSection variant="compact" />
    </div>
  );
}
