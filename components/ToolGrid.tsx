"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Contact,
  FileArchive,
  FileImage,
  IdCard,
  ImageDown,
  Layers,
  QrCode,
  RefreshCw,
  ScanText,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";

import {
  getTabLabel,
  MVP_TOOLS,
  type ToolDefinition,
  type ToolIconId,
  type ToolTabId,
  TOOL_TAB_IDS,
  toolMatchesSearch,
} from "@/lib/tools-data";
import { getToolCardIconSrc } from "@/lib/tool-card-icons";

const ICONS: Record<ToolIconId, LucideIcon> = {
  layers: Layers,
  "file-archive": FileArchive,
  "file-image": FileImage,
  "wand-sparkles": WandSparkles,
  "image-down": ImageDown,
  "refresh-cw": RefreshCw,
  contact: Contact,
  "id-card": IdCard,
  "qr-code": QrCode,
  "scan-text": ScanText,
};

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 380, damping: 28 },
  },
};

function filterTools(tab: ToolTabId, query: string): ToolDefinition[] {
  return MVP_TOOLS.filter((tool) => {
    const tabOk = tab === "all" || tool.category === tab;
    return tabOk && toolMatchesSearch(tool, query);
  });
}

export function ToolGrid() {
  const [tab, setTab] = useState<ToolTabId>("all");
  const [search, setSearch] = useState("");

  const visible = useMemo(() => filterTools(tab, search), [tab, search]);

  return (
    <section id="tools" className="scroll-mt-20 border-b border-slate-100 bg-slate-50/80 px-6 py-14 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-black sm:text-3xl">All tools</h2>
            <p className="mt-1 text-sm text-slate-600">Search, filter, and open a tool in one tap.</p>
          </div>
          <label className="w-full sm:max-w-xs">
            <span className="sr-only">Search tools</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or category…"
              className="min-h-[48px] w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm text-black shadow-sm outline-none ring-black/5 transition placeholder:text-slate-400 focus:border-slate-200 focus:ring-2"
            />
          </label>
        </div>

        <div
          className="mb-8 flex flex-wrap gap-2"
          role="tablist"
          aria-label="Filter by category"
        >
          {TOOL_TAB_IDS.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`min-h-[44px] rounded-full border px-4 py-2 text-sm font-medium transition ${
                tab === id
                  ? "border-black bg-black text-white"
                  : "border-slate-100 bg-white text-slate-700 hover:border-slate-200 hover:bg-slate-50"
              }`}
            >
              {getTabLabel(id)}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {visible.length === 0 ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="rounded-xl border border-slate-100 bg-white px-6 py-16 text-center text-sm font-medium text-slate-600"
            >
              Tool not found — try another search or category.
            </motion.p>
          ) : (
            <motion.ul
              key={`${tab}-${search}`}
              layout
              className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3 lg:gap-6"
              variants={listVariants}
              initial="hidden"
              animate="show"
            >
              {visible.map((tool) => {
                const Icon = ICONS[tool.icon];
                const cardIconSrc = getToolCardIconSrc(tool.slug);
                return (
                  <motion.li key={tool.slug} variants={cardVariants} layout className="list-none">
                    <Link href={`/tools/${tool.slug}`} className="block h-full min-h-[120px]">
                      <motion.div
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.99 }}
                        transition={{ type: "spring", stiffness: 420, damping: 26 }}
                        className="relative flex h-full flex-row items-start gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                      >
                        {tool.is_pro ? (
                          <span className="absolute right-4 top-4 rounded-md border border-amber-200/80 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-900">
                            Pro
                          </span>
                        ) : null}
                        <div className="flex h-28 w-28 shrink-0 items-center justify-center sm:h-32 sm:w-32">
                          {cardIconSrc ? (
                            <Image
                              src={cardIconSrc}
                              alt=""
                              width={128}
                              height={128}
                              className="max-h-full max-w-full object-contain object-center"
                              sizes="(max-width: 768px) 112px, 128px"
                              aria-hidden
                            />
                          ) : (
                            <Icon className="h-14 w-14 shrink-0 text-slate-800 sm:h-16 sm:w-16" aria-hidden />
                          )}
                        </div>
                        <div className={`flex min-w-0 flex-1 flex-col ${tool.is_pro ? "pr-16" : ""}`}>
                          <h3 className="text-base font-semibold text-black">{tool.name}</h3>
                          <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{tool.description}</p>
                          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-400">
                            {getTabLabel(tool.category)}
                          </p>
                        </div>
                      </motion.div>
                    </Link>
                  </motion.li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
