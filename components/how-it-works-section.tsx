"use client";

import { motion } from "framer-motion";
import {
  CloudOff,
  Cpu,
  Download,
  Fingerprint,
  LayoutGrid,
  Lock,
  Shield,
  Zap,
} from "lucide-react";

const fade = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

export function HowItWorksSection() {
  return (
    <div className="bg-white px-6 py-14 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={fade}>
          <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">How it works</h1>
          <p className="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-slate-600 sm:text-lg">
            Everything runs in your browser. You buy a pass once, use the power of your own device, and
            keep sensitive files off our servers.
          </p>
        </motion.div>

        <motion.div
          className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
          variants={stagger}
        >
          <motion.div
            variants={item}
            className="md:col-span-2 rounded-2xl border border-slate-100 bg-slate-50/60 p-6 sm:p-8"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-100 bg-white text-black">
              <LayoutGrid className="h-5 w-5" aria-hidden />
            </div>
            <h2 className="mt-4 text-lg font-bold text-black sm:text-xl">Select a tool</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
              Choose from our 10+ essential PDF and image tools. Each card opens a dedicated workspace—no
              installs, no queues.
            </p>
          </motion.div>

          <motion.div variants={item} className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-black">
              <Cpu className="h-5 w-5" aria-hidden />
            </div>
            <h2 className="mt-4 text-lg font-bold text-black sm:text-xl">Local processing</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
              Your file is processed entirely in your browser. It is never uploaded to our servers.
            </p>
          </motion.div>

          <motion.div variants={item} className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-black">
              <Download className="h-5 w-5" aria-hidden />
            </div>
            <h2 className="mt-4 text-lg font-bold text-black sm:text-xl">Instant download</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
              Get your converted file in seconds—high quality and ready to upload to exam portals or share
              securely.
            </p>
          </motion.div>

          <motion.div
            variants={item}
            className="md:col-span-2 rounded-2xl border border-slate-100 bg-black p-6 text-white sm:p-8"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-white/70">The privacy advantage</p>
            <h2 className="mt-2 text-xl font-bold sm:text-2xl">Why we&apos;re different</h2>
            <ul className="mt-6 space-y-5">
              <li className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <CloudOff className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="font-semibold">Zero server uploads</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/75">
                    Most sites store your files. We don&apos;t even see them.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <Lock className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="font-semibold">Bank-grade security mindset</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/75">
                    Ideal for sensitive documents like Aadhar, PAN, and bank statements—because they stay on
                    your machine.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <Zap className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="font-semibold">Speed</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/75">
                    No waiting in queues. Your computer&apos;s power is used for instant results.
                  </p>
                </div>
              </li>
            </ul>
          </motion.div>

          <motion.div
            variants={item}
            className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/80 p-6 sm:p-8"
          >
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-100 bg-white text-black">
                <Shield className="h-5 w-5" aria-hidden />
              </div>
              <h2 className="mt-4 text-lg font-bold text-black sm:text-xl">Passes, not subscriptions</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Pick a daily, weekly, monthly, or yearly pass. Pay once—no auto-debit. When it ends, you drop
                back to the free tier until you&apos;re ready again.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs text-slate-600">
              <Fingerprint className="h-4 w-4 shrink-0 text-black" aria-hidden />
              <span>Your session and plan sync when you sign in—processing still stays local.</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
