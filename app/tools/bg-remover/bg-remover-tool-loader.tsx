"use client";

import dynamic from "next/dynamic";

import type { BgRemoverEligibility } from "@/lib/bg-remover-usage-shared";

export function BgRemoverToolLazy({ initialEligibility }: { initialEligibility: BgRemoverEligibility }) {
  const Tool = dynamic(
    () => import("@/components/tools/bg-remover-tool").then((m) => m.BgRemoverTool),
    {
      ssr: false,
      loading: () => (
        <div className="flex min-h-[40vh] items-center justify-center px-4 text-sm text-slate-600">
          Loading AI Background Remover…
        </div>
      ),
    },
  );
  return <Tool initialEligibility={initialEligibility} />;
}
