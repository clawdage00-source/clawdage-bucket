"use client";

import dynamic from "next/dynamic";

export function ESignToolLazy({ isPro }: { isPro: boolean }) {
  const Tool = dynamic(() => import("@/components/tools/e-sign-tool").then((m) => m.ESignTool), {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center px-4 text-sm text-slate-600">
        Loading E-Sign tool…
      </div>
    ),
  });
  return <Tool isPro={isPro} />;
}
