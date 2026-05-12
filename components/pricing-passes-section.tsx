"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useState } from "react";

import { PaymentComingSoonModal } from "@/components/payment-coming-soon-modal";
import { PAID_PASS_FEATURES, PASS_OPTIONS } from "@/lib/pricing-passes";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.06 },
  },
};

const cardMotion = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 380, damping: 28 } },
};

export function PricingPassesSection() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPass, setSelectedPass] = useState<string | null>(null);

  function openBuy(passName: string) {
    setSelectedPass(passName);
    setModalOpen(true);
  }

  return (
    <>
      <motion.div
        className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-6 sm:gap-5 md:grid-cols-2 lg:grid-cols-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {PASS_OPTIONS.map((pass) => (
          <motion.article
            key={pass.id}
            variants={cardMotion}
            className={`relative flex flex-col rounded-2xl border bg-white p-5 shadow-sm sm:p-6 ${
              pass.popular
                ? "z-[1] border-black/80 ring-2 ring-black/15 shadow-md lg:scale-[1.02]"
                : "border-slate-100"
            }`}
          >
            {pass.popular ? (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-black bg-black px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Popular
              </span>
            ) : null}
            <div className={`mb-3 min-h-[28px] ${pass.popular ? "mt-2" : ""}`}>
              {pass.tag ? (
                <span
                  className={`inline-flex w-fit rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                    pass.popular
                      ? "border-amber-200 bg-amber-50 text-amber-900"
                      : "border-slate-200 bg-slate-50 text-slate-700"
                  }`}
                >
                  {pass.tag}
                </span>
              ) : !pass.popular ? (
                <span className="block h-[26px]" aria-hidden />
              ) : null}
            </div>

            <h3 className="text-lg font-bold text-black">{pass.name}</h3>
            <p className="mt-1 flex items-baseline gap-0.5">
              <span className="text-3xl font-bold tracking-tight text-black sm:text-4xl">
                {pass.currency}
                {pass.price}
              </span>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{pass.description}</p>
            <ul className="mt-5 flex flex-1 flex-col gap-2.5 border-t border-slate-100 pt-5">
              {PAID_PASS_FEATURES.map((line) => (
                <li key={line} className="flex gap-2 text-sm text-slate-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-black" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => openBuy(pass.name)}
              className="mt-6 min-h-[48px] w-full rounded-xl bg-black py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Buy Now
            </button>
          </motion.article>
        ))}
      </motion.div>

      <PaymentComingSoonModal
        open={modalOpen}
        passName={selectedPass}
        onClose={() => {
          setModalOpen(false);
          setSelectedPass(null);
        }}
      />
    </>
  );
}
