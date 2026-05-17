import Link from "next/link";
import { notFound } from "next/navigation";

import { ToolJsonLd } from "@/components/JsonLd";
import { ToolSeoContent } from "@/components/tool-seo-content";
import { buildToolMetadata } from "@/lib/seo/build-tool-metadata";
import { getToolBySlug, MVP_TOOL_SLUGS } from "@/lib/tools-data";

/** Slugs that have `app/tools/<slug>/page.tsx` — do not duplicate under `[slug]`. */
const DEDICATED_TOOL_SLUGS = new Set([
  "bg-remover",
  "e-sign",
  "excel-editor",
  "id-resizer",
  "image-compressor",
  "ocr",
  "passport-photo",
  "pdf-to-excel",
  "qr-generator",
]);

type ToolPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return MVP_TOOL_SLUGS.filter((slug) => !DEDICATED_TOOL_SLUGS.has(slug)).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ToolPageProps) {
  const { slug } = await params;
  return buildToolMetadata(slug);
}

export default async function ToolCatchAllPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) {
    notFound();
  }

  return (
    <>
      <ToolJsonLd slug={slug} />
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{tool.name}</h1>
        <p className="mt-4 rounded-xl border border-border bg-muted/80 px-4 py-6 text-sm leading-relaxed text-muted-foreground">
          Open this tool from the home catalog — the full workspace runs in your browser with the same
          privacy-first defaults where supported.
        </p>
        <Link
          href="/#tools"
          className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Open {tool.name} from all tools
        </Link>
        <Link
          href="/#tools"
          className="mt-8 inline-flex text-sm font-medium text-foreground underline underline-offset-4 hover:text-muted-foreground"
        >
          ← Back to all tools
        </Link>
      </div>
      <ToolSeoContent slug={slug} />
    </>
  );
}
