import Image from "next/image";
import Link from "next/link";

import { getToolCardIconSrc } from "@/lib/tool-card-icons";
import { MVP_TOOLS } from "@/lib/tools-data";

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

type FloatingIcon = {
  slug: string;
  name: string;
  src: string;
  wing: "left" | "right";
  topPct: number;
  insetPct: number;
  sizePx: number;
  delaySec: number;
  durationSec: number;
};

function buildFloatingIcons(): FloatingIcon[] {
  const withIcons = MVP_TOOLS.filter((t) => getToolCardIconSrc(t.slug));
  const n = withIcons.length;
  return withIcons.map((tool, index) => {
    const h = hash(tool.slug);
    const h2 = hash(`${tool.slug}:y`);
    const wing: "left" | "right" = index % 2 === 0 ? "left" : "right";
    const spread = n > 1 ? (index / (n - 1)) * 68 + 10 : 45;
    const jitter = (h2 % 9) - 4;
    const topPct = Math.min(86, Math.max(10, spread + jitter));
    const insetPct = 2 + (h % 9);
    const sizePx = 40 + (h % 28);
    const delaySec = (h % 4000) / 1000;
    const durationSec = 5.5 + (h % 5) * 0.35;
    return {
      slug: tool.slug,
      name: tool.name,
      src: getToolCardIconSrc(tool.slug)!,
      wing,
      topPct,
      insetPct,
      sizePx,
      delaySec,
      durationSec,
    };
  });
}

const FLOATING_ICONS = buildFloatingIcons();

export function Hero() {
  return (
    <section className="relative flex min-h-[100vh] w-full items-center justify-center overflow-hidden border-b border-slate-100 bg-gradient-to-b from-slate-50/90 via-white to-white px-4 py-12 sm:px-6 sm:py-16">
      {/* Tool icons: only in left/right wings (outside center copy). */}
      <div className="pointer-events-none absolute inset-0 z-0 select-none">
        <ul className="absolute inset-0 m-0 list-none p-0" aria-label="Tool highlights">
          {FLOATING_ICONS.map((item) => {
            const wingStyle =
              item.wing === "left"
                ? { left: `${item.insetPct}%`, right: "auto" as const }
                : { right: `${item.insetPct}%`, left: "auto" as const };
            return (
              <li
                key={item.slug}
                className="pointer-events-auto absolute z-0 max-h-[min(22vw,4.25rem)] max-w-[min(22vw,4.25rem)] drop-shadow-[0_1px_8px_rgba(15,23,42,0.12)] sm:max-h-[min(20vw,4.5rem)] sm:max-w-[min(20vw,4.5rem)]"
                style={{
                  top: `${item.topPct}%`,
                  ...wingStyle,
                  width: item.sizePx,
                  height: item.sizePx,
                  animationDelay: `${item.delaySec}s`,
                  animationDuration: `${item.durationSec}s`,
                }}
              >
                <Link
                  href={`/tools/${item.slug}`}
                  className="relative block h-full w-full outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                  title={item.name}
                >
                  <span className="hero-float-icon relative block h-full w-full">
                    <Image
                      src={item.src}
                      alt=""
                      fill
                      className="object-contain"
                      sizes="(max-width: 640px) 20vw, 72px"
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Center column: no floating icons here (clear band ~44%–56% on md+ via wing insets). */}
      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 text-center sm:px-6">
        <h1 className="text-balance text-3xl font-bold tracking-tight text-black sm:text-4xl lg:text-5xl">
          <span className="block sm:inline">Professional Tools for the </span>
          <span className="mt-1 block bg-gradient-to-r from-zinc-900 via-black to-zinc-700 bg-clip-text text-transparent sm:mt-0 sm:inline">
            Price of a Chai.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-slate-600 sm:text-lg">
          Merge PDFs, Remove Backgrounds, and Resize Documents for Indian Exam Portals. No
          Subscriptions. Just Daily &amp; Weekly Passes starting at ₹19.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="#tools"
            className="inline-flex min-h-[48px] w-full max-w-xs items-center justify-center rounded-xl bg-black px-8 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 sm:w-auto"
          >
            Explore All Tools
          </Link>
        </div>
        <p className="mt-6 max-w-xl text-pretty text-xs leading-relaxed text-slate-500 sm:text-sm">
          🔒 All processing happens in your browser. Your files never leave your device.
        </p>
      </div>
    </section>
  );
}
