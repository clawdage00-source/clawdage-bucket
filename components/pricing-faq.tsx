"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";

const FAQ_ITEMS = [
  {
    q: "Is this a subscription?",
    a: "No, these are one-time passes. We will never auto-charge your card.",
  },
  {
    q: "Which payment methods are supported?",
    a: "We support all major UPI apps (GPay, PhonePe, Paytm), Credit/Debit cards, and Net Banking.",
  },
  {
    q: "What happens after my pass expires?",
    a: "You will revert to the Free Plan (3 files/day) until you purchase another pass.",
  },
] as const;

export function PricingFaq() {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <motion.section
      className="mx-auto max-w-3xl px-6 pb-16"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45 }}
    >
      <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        Frequently Asked Questions
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Straight answers about passes and billing.</p>
      <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card">
        {FAQ_ITEMS.map((item, index) => {
          const open = openIndex === index;
          const panelId = `${baseId}-panel-${index}`;
          const headerId = `${baseId}-header-${index}`;
          return (
            <div key={item.q} className="px-4 sm:px-5">
              <h3>
                <button
                  type="button"
                  id={headerId}
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(open ? null : index)}
                  className="flex w-full min-h-[52px] items-center justify-between gap-3 py-4 text-left text-sm font-semibold text-foreground sm:text-base"
                >
                  {item.q}
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
              </h3>
              <AnimatePresence initial={false}>
                {open ? (
                  <motion.div
                    id={panelId}
                    role="region"
                    aria-labelledby={headerId}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] as const }}
                    className="overflow-hidden"
                  >
                    <p className="pb-4 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}
