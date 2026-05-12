"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";

type PaymentComingSoonModalProps = {
  open: boolean;
  passName: string | null;
  onClose: () => void;
};

export function PaymentComingSoonModal({ open, passName, onClose }: PaymentComingSoonModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && passName ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
            aria-label="Close dialog"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-soon-title"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="relative w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-xl"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 hover:text-black"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <p id="payment-soon-title" className="pr-10 text-lg font-semibold text-black">
              Payment integration coming soon
            </p>
            <p className="mt-2 text-sm text-slate-600">
              You selected <span className="font-medium text-black">{passName}</span>. UPI, cards, and
              netbanking checkout will open here once payments are wired up.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-xl bg-black py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Got it
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
