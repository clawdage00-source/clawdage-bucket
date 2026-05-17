"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Eraser, Lock, Shield, ShieldCheck, Trash2 } from "lucide-react";

const TRUST_ITEMS = [
  {
    icon: Shield,
    title: "Files never leave your device",
    description: "Supported tools process documents locally in your browser — not on our servers.",
  },
  {
    icon: Lock,
    title: "No server storage",
    description: "We do not keep copies of your PDFs, photos, or signatures after you close the tab.",
  },
  {
    icon: ShieldCheck,
    title: "Secure local processing",
    description: "Modern browser APIs handle compression, resize, and conversion on your machine.",
  },
  {
    icon: Trash2,
    title: "Auto cleanup",
    description: "Session data clears when you refresh or leave — nothing lingering in the cloud.",
  },
  {
    icon: Eraser,
    title: "Privacy-first architecture",
    description: "Built for Aadhaar, exam forms, and bank uploads where trust matters most.",
  },
] as const;

type TrustSectionProps = {
  variant?: "default" | "compact";
  className?: string;
};

export function TrustSection({ variant = "default", className = "" }: TrustSectionProps) {
  const reduceMotion = useReducedMotion();
  const compact = variant === "compact";

  return (
    <section
      className={`border-t border-border bg-muted/50 px-6 py-12 sm:py-14 ${className}`}
      aria-labelledby="trust-section-heading"
    >
      <motion.div
        className="mx-auto max-w-6xl"
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          className="flex items-center gap-3"
          initial={reduceMotion ? false : { scale: 0.95, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35 }}
        >
          <motion.div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-[#251EFF] shadow-sm">
            <Shield className="h-5 w-5" aria-hidden />
          </motion.div>
          <motion.div
            className="h-px flex-1 bg-gradient-to-r from-border via-[#251EFF]/30 to-transparent"
            initial={reduceMotion ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{ transformOrigin: "left" }}
          />
        </motion.div>

        <h2
          id="trust-section-heading"
          className={`mt-5 font-bold tracking-tight text-foreground ${compact ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"}`}
        >
          Your files stay on your device
        </h2>
        <p className={`mt-3 max-w-2xl text-muted-foreground ${compact ? "text-sm" : "text-base"}`}>
          Clawdage is designed for Indian students, exam applicants, and office users who cannot risk uploading
          sensitive documents to random file hosts.
        </p>

        <ul
          className={`mt-8 grid gap-4 ${compact ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"}`}
        >
          {TRUST_ITEMS.map(({ icon: Icon, title, description }, i) => (
            <motion.li
              key={title}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm"
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#251EFF]/10 text-[#251EFF]">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </section>
  );
}
