"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CreditCard, Globe, Shield, Smartphone, Upload } from "lucide-react";
import Link from "next/link";

import { HeroGridBeams } from "@/components/ui/background-beams";

const easeOut = [0.16, 1, 0.3, 1] as const;

const HERO_GRID_CELL_PX = 80;

const TRUST_BADGES = [
  { icon: Globe, label: "100% Browser Processing" },
  { icon: Upload, label: "No File Uploads" },
  { icon: Shield, label: "Privacy First" },
  { icon: Smartphone, label: "Mobile Friendly" },
  { icon: CreditCard, label: "No Auto Debit" },
] as const;

export function Hero() {
  const reduceMotion = useReducedMotion();

  const copyTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.6, delay: 0.2, ease: easeOut };

  return (
    <section className="relative -mt-14 flex min-h-[min(100vh,52rem)] w-full items-center justify-center overflow-x-hidden bg-background px-6 py-24 sm:py-28">
      <HeroGridBeams cellSize={HERO_GRID_CELL_PX} className="z-0" />

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center text-center">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={copyTransition}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Built for <span className="text-[#251EFF]">India</span>
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-[3.25rem]">
            India&apos;s Daily Digital Utility Platform
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Resize Aadhaar photos, create passport photos, compress PDFs, convert files, remove backgrounds, and
            more — instantly in your browser.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/#tools"
              className="inline-flex min-h-[48px] w-full min-w-[200px] items-center justify-center rounded-xl bg-[#251EFF] px-6 text-sm font-semibold text-white shadow-lg shadow-[#251EFF]/25 transition hover:opacity-90 sm:w-auto"
            >
              Start Using Tools
            </Link>
            <Link
              href="/#tools"
              className="inline-flex min-h-[48px] w-full min-w-[200px] items-center justify-center rounded-xl border border-border bg-card px-6 text-sm font-semibold text-foreground transition hover:bg-muted sm:w-auto"
            >
              Explore All Tools
            </Link>
          </div>

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {TRUST_BADGES.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1.5 text-[11px] font-medium text-muted-foreground backdrop-blur-sm sm:text-xs"
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-[#251EFF]" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
