import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getExamUtilityLinks, getRelatedBlogsForTool, getRelatedTools } from "@/lib/seo/internal-links";
import { TOOL_ICONS } from "@/lib/tool-icons";

type RelatedToolsSectionProps = {
  slug: string;
  showExamLinks?: boolean;
};

export function RelatedToolsSection({ slug, showExamLinks = true }: RelatedToolsSectionProps) {
  const related = getRelatedTools(slug, 4);
  const blogs = getRelatedBlogsForTool(slug);
  const examLinks = showExamLinks ? getExamUtilityLinks().slice(0, 6) : [];

  if (!related.length && !blogs.length && !examLinks.length) {
    return null;
  }

  return (
    <section className="border-t border-border bg-background px-6 py-12 sm:py-14" aria-labelledby="related-tools-heading">
      <div className="mx-auto max-w-6xl">
        {related.length > 0 ? (
          <>
            <h2 id="related-tools-heading" className="text-xl font-bold text-foreground sm:text-2xl">
              Related tools
            </h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((tool) => {
                const Icon = TOOL_ICONS[tool.icon];
                return (
                  <li key={tool.slug}>
                    <Link
                      href={`/tools/${tool.slug}`}
                      className="group flex h-full flex-col rounded-2xl border border-border bg-card p-4 transition hover:border-[#251EFF]/40 hover:shadow-md"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#251EFF]/10 text-[#251EFF]">
                        <Icon className="h-5 w-5" aria-hidden />
                      </div>
                      <span className="mt-3 text-sm font-semibold text-foreground group-hover:text-[#251EFF]">
                        {tool.name}
                      </span>
                      <span className="mt-1 line-clamp-2 text-xs text-muted-foreground">{tool.description}</span>
                      <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#251EFF]">
                        Open tool
                        <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        ) : null}

        {blogs.length > 0 ? (
          <div className="mt-12">
            <h3 className="text-lg font-bold text-foreground">Related guides</h3>
            <ul className="mt-4 space-y-2">
              {blogs.map((post) => (
                <li key={post.slug}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-sm font-medium text-[#251EFF] underline-offset-2 hover:underline"
                  >
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {examLinks.length > 0 ? (
          <div className="mt-12">
            <h3 className="text-lg font-bold text-foreground">Popular exam utilities</h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {examLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-[#251EFF]/40 hover:bg-[#251EFF]/5"
                  >
                    {link.label}
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
