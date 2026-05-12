"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function ToolsPageCta() {
  return (
    <motion.section
      className="border-t border-slate-100 bg-slate-50/80 px-6 py-14"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] as const }}
    >
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-lg font-semibold tracking-tight text-black sm:text-xl">Ready to get started?</p>
        <Link
          href="/#tools"
          className="mt-5 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-black px-8 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
        >
          Go to Tools
        </Link>
      </div>
    </motion.section>
  );
}
