import Link from "next/link";
import { notFound } from "next/navigation";

import { getToolBySlug, MVP_TOOL_SLUGS } from "@/lib/tools-data";

type ToolPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return MVP_TOOL_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) {
    return { title: "Tool" };
  }
  return { title: `${tool.name} · EssentialToolbox` };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-black">{tool.name}</h1>
      <p className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-6 text-sm leading-relaxed text-slate-700">
        Coming soon: tool interface. You&apos;ll be able to run this workflow entirely in your
        browser.
      </p>
      <Link
        href="/#tools"
        className="mt-8 inline-flex text-sm font-medium text-black underline underline-offset-4 hover:text-slate-700"
      >
        ← Back to all tools
      </Link>
    </div>
  );
}
