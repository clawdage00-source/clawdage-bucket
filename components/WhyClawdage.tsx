"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Globe2, IndianRupee, Smartphone, Sparkles, Zap } from "lucide-react";

const REASONS = [
  {
    icon: Globe2,
    title: "Built for Indian users",
    description: "Aadhaar, PAN, SSC, UPSC, NEET, and banking portal sizes — not generic US defaults.",
  },
  {
    icon: Zap,
    title: "Fast government portal utilities",
    description: "Hit KB limits, pixel dimensions, and signature boxes without installing software.",
  },
  {
    icon: Smartphone,
    title: "Works on mobile",
    description: "Cyber café phones and budget Android devices — thumb-friendly uploads and previews.",
  },
  {
    icon: Sparkles,
    title: "No software installation",
    description: "Open clawdage.com, pick a tool, and finish in your browser in minutes.",
  },
  {
    icon: IndianRupee,
    title: "No recurring subscriptions",
    description: "Optional Daily Pass from ₹19 when you need Pro — no auto-debit traps.",
  },
] as const;

export function WhyClawdage() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="why-clawdage"
      className="scroll-mt-20 border-t border-border bg-background px-6 py-20 sm:py-24"
      aria-labelledby="why-clawdage-heading"
    >
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Why <span className="text-[#251EFF]">Clawdage</span>?
          </p>
          <h2
            id="why-clawdage-heading"
            className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
          >
            India&apos;s daily digital utility platform — not another generic PDF site
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Students, government exam applicants, freelancers, and small offices use Clawdage for the exact file
            tasks Indian portals demand — resize, compress, sign, and convert without sending files to strangers.
          </p>
        </motion.div>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {REASONS.map(({ icon: Icon, title, description }, i) => (
            <motion.li
              key={title}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.07 }}
            >
              <motion.div
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#251EFF]/10 text-[#251EFF]"
                whileHover={reduceMotion ? undefined : { scale: 1.05 }}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </motion.div>
              <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
