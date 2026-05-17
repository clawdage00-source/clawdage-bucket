import Link from "next/link";

import { BackToTop } from "@/components/legal/back-to-top";
import { cn } from "@/lib/utils";

export type LegalTocItem = {
  id: string;
  label: string;
};

type LegalPageShellProps = {
  title: string;
  lastUpdated: string;
  toc: LegalTocItem[];
  trustBanner?: React.ReactNode;
  children: React.ReactNode;
};

export function LegalSection({
  id,
  title,
  children,
  className,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("scroll-mt-28", className)}>
      <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{title}</h2>
      <div className="prose-legal mt-4 space-y-4 text-base leading-relaxed text-slate-600">
        {children}
      </div>
    </section>
  );
}

export function LegalPageShell({
  title,
  lastUpdated,
  toc,
  trustBanner,
  children,
}: LegalPageShellProps) {
  return (
    <article className="min-h-screen bg-white pb-24 pt-8 sm:pt-12">
      <div className="mx-auto max-w-[800px] px-5 sm:px-6">
        <header className="border-b border-slate-200 pb-8">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Legal</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm text-slate-500">Last updated: {lastUpdated}</p>
        </header>

        {trustBanner ? <div className="mt-8">{trustBanner}</div> : null}

        <nav
          aria-label="Table of contents"
          className="mt-10 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 sm:p-6"
        >
          <p className="text-sm font-semibold text-slate-900">On this page</p>
          <ol className="mt-3 space-y-2">
            {toc.map(({ id, label }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="text-sm text-slate-600 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-900 hover:decoration-slate-500"
                >
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-12 space-y-14 sm:space-y-16">{children}</div>

        <footer className="mt-16 border-t border-slate-200 pt-10">
          <h2 className="text-lg font-semibold text-slate-900">Contact</h2>
          <p className="mt-3 text-base leading-relaxed text-slate-600">
            Have questions? Contact us at{" "}
            <a
              href="mailto:mail@essentialtoolbox.com"
              className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-600"
            >
              mail@essentialtoolbox.com
            </a>
            .
          </p>
          <p className="mt-6 text-sm text-slate-500">
            See also:{" "}
            <Link href="/terms" className="underline underline-offset-4 hover:text-slate-800">
              Terms &amp; Conditions
            </Link>
            {" · "}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-slate-800">
              Privacy Policy
            </Link>
          </p>
        </footer>
      </div>
      <BackToTop />
    </article>
  );
}
