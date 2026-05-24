"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { getToolCardIconSrc } from "@/lib/tool-card-icons";
import {
  MVP_TOOLS,
  isNewTool,
  TOOL_TAB_IDS,
  getTabLabel,
  type ToolCategory,
  type ToolDefinition,
} from "@/lib/tools-data";
import { cn } from "@/lib/utils";

const CATEGORIES = TOOL_TAB_IDS.filter((id): id is ToolCategory => id !== "all");

function toolsByCategory(): { label: string; tools: ToolDefinition[] }[] {
  return CATEGORIES.map((category) => ({
    label: getTabLabel(category),
    tools: MVP_TOOLS.filter((t) => t.category === category),
  })).filter((g) => g.tools.length > 0);
}

const GROUPS = toolsByCategory();

type ServicesNavTriggerProps = {
  open: boolean;
  className?: string;
};

export function ServicesNavTrigger({ open, className }: ServicesNavTriggerProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg px-2 py-1.5 transition",
        open ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      Services
      <ChevronDown
        className={cn("h-4 w-4 transition-transform duration-200", open && "rotate-180")}
        aria-hidden
      />
    </span>
  );
}

type ServicesMegaPanelProps = {
  onNavigate?: () => void;
};

export function ServicesMegaPanel({ onNavigate }: ServicesMegaPanelProps) {
  return (
    <motion.div
      key="services-mega-panel"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="overflow-hidden border-t border-border bg-background"
    >
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-foreground">Browse tools</p>
          <Link
            href="/#tools"
            className="text-xs font-medium text-[#251EFF] hover:underline"
            onClick={onNavigate}
          >
            View all on homepage
          </Link>
        </div>
        <div className="grid max-h-[min(55vh,22rem)] gap-6 overflow-y-auto sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {GROUPS.map(({ label, tools }) => (
            <div key={label}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </p>
              <ul className="space-y-0.5">
                {tools.map((tool) => {
                  const iconSrc = getToolCardIconSrc(tool.slug);
                  return (
                    <li key={tool.slug}>
                      <Link
                        href={`/tools/${tool.slug}`}
                        className="group flex items-center gap-2.5 rounded-lg px-2 py-2 transition hover:bg-muted"
                        onClick={onNavigate}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                          {iconSrc ? (
                            <Image
                              src={iconSrc}
                              alt=""
                              width={28}
                              height={28}
                              className="h-7 w-7 object-contain"
                            />
                          ) : (
                            <span className="text-[10px] font-bold text-muted-foreground">
                              {tool.name.slice(0, 2)}
                            </span>
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-foreground group-hover:text-foreground">
                            {tool.name}
                          </span>
                          {tool.is_pro ? (
                            <span className="text-[10px] font-medium uppercase tracking-wide text-amber-700">
                              Pro
                            </span>
                          ) : isNewTool(tool.slug) ? (
                            <span className="text-[10px] font-medium uppercase tracking-wide text-emerald-700">
                              New
                            </span>
                          ) : null}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function MobileServicesTools({ onNavigate }: { onNavigate: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col">
      <button
        type="button"
        className="flex items-center justify-between rounded-xl px-4 py-3.5 text-xl font-semibold text-foreground transition hover:bg-muted"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        Services
        <ChevronDown
          className={cn("h-5 w-5 text-muted-foreground transition-transform", expanded && "rotate-180")}
          aria-hidden
        />
      </button>
      {expanded ? (
        <ul className="mb-2 max-h-[50vh] space-y-0.5 overflow-y-auto px-2 pb-2">
          {MVP_TOOLS.map((tool) => (
            <li key={tool.slug}>
              <Link
                href={`/tools/${tool.slug}`}
                className="block rounded-lg px-4 py-2.5 text-base font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                onClick={onNavigate}
              >
                {tool.name}
                {tool.is_pro ? (
                  <span className="ml-2 text-xs font-semibold uppercase text-amber-700">Pro</span>
                ) : isNewTool(tool.slug) ? (
                  <span className="ml-2 text-xs font-semibold uppercase text-emerald-700">New</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
