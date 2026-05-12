"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, type ReactNode } from "react";

type DailyPassUpsellModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: ReactNode;
  secondaryActionLabel?: string;
};

const DEFAULT_TITLE = "Bulk compress is a Pro feature";
const DEFAULT_SECONDARY = "Use one image";

export function DailyPassUpsellModal({
  open,
  onClose,
  title = DEFAULT_TITLE,
  description,
  secondaryActionLabel = DEFAULT_SECONDARY,
}: DailyPassUpsellModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const defaultDescription = (
    <>
      Free accounts compress <span className="font-medium text-black">one image at a time</span>.
      Upgrade to a <span className="font-medium text-black">Daily Pass from ₹19</span> to compress up
      to <span className="font-medium text-black">20 images</span> in one go.
    </>
  );

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
            aria-label="Close"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="upsell-title"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="relative w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-xl"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-black"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <p id="upsell-title" className="pr-10 text-lg font-semibold text-black">
              {title}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {description ?? defaultDescription}
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Link
                href="/pricing"
                className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-black px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-zinc-800"
                onClick={onClose}
              >
                View passes
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-slate-50"
              >
                {secondaryActionLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
