"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Fingerprint, IndianRupee, Landmark } from "lucide-react";
import Link from "next/link";

const ease = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease },
  },
};

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.08 },
  },
};

const card = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease },
  },
};

const PILLARS = [
  {
    icon: Fingerprint,
    title: "Privacy-first",
    description:
      "Your documents are your business. We process everything locally in your browser so we never even see your files.",
  },
  {
    icon: IndianRupee,
    title: "Affordable access",
    description:
      "Stop paying for monthly subscriptions you don't use. Get a Daily, Weekly, or Monthly pass only when you need it.",
  },
  {
    icon: Landmark,
    title: "Built for India",
    description:
      "Optimized for SSC, UPSC, and banking portals. We understand the specific dimensions and KB limits you need.",
  },
] as const;

export function AboutUs() {
  const reduceMotion = useReducedMotion();
  const viewport = { once: true, margin: "-80px" as const };
  const motionProps = reduceMotion
    ? { initial: false as const, whileInView: undefined }
    : { initial: "hidden" as const, whileInView: "show" as const, viewport };

  return (
    <section
      id="about"
      className="scroll-mt-20 border-t border-border bg-muted px-6 py-20 sm:py-24 lg:py-28"
      aria-labelledby="about-heading"
    >
      <div className="mx-auto max-w-7xl">
        <motion.div {...motionProps} variants={fadeUp}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            About <span className="text-[#251EFF]">Clawdage</span>
          </p>
          <h2
            id="about-heading"
            className="mt-4 max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            We&apos;re redefining digital utilities for the Indian context.
          </h2>
        </motion.div>

        <motion.div
          className="mt-14 grid grid-cols-1 gap-4 sm:mt-16 md:grid-cols-3 md:gap-5"
          {...motionProps}
          variants={stagger}
        >
          {PILLARS.map(({ icon: Icon, title, description }, index) => (
            <motion.article
              key={title}
              variants={card}
              className={`group rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm transition duration-300 sm:p-8 ${
                index === 1 ? "md:-translate-y-1" : ""
              } hover:border-border hover:shadow-md`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-muted text-foreground transition group-hover:bg-background">
                <Icon className="h-5 w-5 stroke-[1.5]" aria-hidden />
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                {title}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">{description}</p>
            </motion.article>
          ))}
        </motion.div>

        <motion.div
          className="mt-16 max-w-3xl border-t border-border pt-14 lg:mt-20 lg:pt-16"
          {...motionProps}
          variants={fadeUp}
        >
          <h3 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Our story</h3>
          <div className="mt-5 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg sm:leading-relaxed">
              <p>
                We kept seeing the same frustration: people paying ₹1,000 a month just to merge a PDF
                or resize an Aadhar card for an exam form. Powerful software locked behind subscriptions
                most of us use once a month—if that.
              </p>
              <p>
                <strong className="font-semibold text-foreground">That felt wrong.</strong> So we built
                Clawdage with a simpler promise: world-class utilities for about the price of
                a cup of chai—starting at ₹19. No auto-debit traps. No uploading your life&apos;s
                documents to a stranger&apos;s cloud.
              </p>
              <p>
                <strong className="font-semibold text-foreground">Local browser processing</strong> is at
                the center of what we do. Your files stay on your device while you work; we focus on
                fast, reliable tools tuned for Indian portals, file-size limits, and real-world
                deadlines.
              </p>
            </div>
        </motion.div>

        <motion.div className="mt-14 sm:mt-16" {...motionProps} variants={fadeUp}>
          <Link
            href="/how-it-works"
            className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground sm:text-base"
          >
            Learn more about our technology on the How it Works page
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
