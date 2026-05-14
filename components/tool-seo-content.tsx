import Link from "next/link";

import { SITE_NAME } from "@/lib/seo/brand";
import { getToolSeoEntry } from "@/lib/seo/tool-registry";
import { getToolBySlug } from "@/lib/tools-data";

type ToolSeoContentProps = {
  slug: string;
};

export function ToolSeoContent({ slug }: ToolSeoContentProps) {
  const tool = getToolBySlug(slug);
  const seo = getToolSeoEntry(slug);
  if (!tool || !seo) {
    return null;
  }

  return (
    <article
      className="border-t border-slate-200 bg-slate-50/80 px-6 py-14 sm:py-16"
      itemScope
      itemType="https://schema.org/SoftwareApplication"
    >
      <meta itemProp="name" content={tool.name} />
      <div className="mx-auto max-w-3xl text-left">
        <h2 className="text-2xl font-bold tracking-tight text-black sm:text-3xl">
          How to use {tool.name}
        </h2>
        <ol className="mt-6 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-slate-800 sm:text-base">
          {seo.howToSteps.map((step, i) => (
            <li key={i} className="pl-1">
              {step}
            </li>
          ))}
        </ol>

        <h2 className="mt-12 text-xl font-bold text-black sm:text-2xl">{seo.whyTitle}</h2>
        <p className="mt-4 text-sm leading-relaxed text-slate-700 sm:text-base">{seo.whyParagraph}</p>

        <h2 className="mt-12 text-xl font-bold text-black sm:text-2xl">{seo.targetHeading}</h2>
        <p className="mt-4 text-sm leading-relaxed text-slate-700 sm:text-base">{seo.targetBody}</p>

        <h3 className="mt-10 text-lg font-semibold text-black">Privacy-first &amp; no surprise uploads</h3>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base">
          {SITE_NAME} is built for people who do not want sensitive PDFs and ID scans on random file hosts. When a tool
          runs fully in your browser, your bytes stay on your device for that workflow. Pro features that call cloud
          APIs are clearly marked — read the banner inside each tool before you process highly sensitive documents.
        </p>

        <h3 className="mt-10 text-lg font-semibold text-black">Frequently asked questions</h3>
        <dl className="mt-4 space-y-6">
          {seo.faqs.map((f) => (
            <div key={f.question}>
              <dt className="text-sm font-semibold text-black">{f.question}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-slate-700">{f.answer}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-12 text-sm text-slate-600">
          Explore more utilities on the{" "}
          <Link href="/#tools" className="font-semibold text-black underline underline-offset-2 hover:text-slate-800">
            all tools
          </Link>{" "}
          page or view{" "}
          <Link href="/pricing" className="font-semibold text-black underline underline-offset-2 hover:text-slate-800">
            passes &amp; pricing
          </Link>
          .
        </p>
      </div>
    </article>
  );
}
