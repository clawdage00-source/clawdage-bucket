"use client";

import dynamic from "next/dynamic";

const PdfSplitTool = dynamic(
  () => import("@/components/tools/pdf-split-tool").then((m) => m.PdfSplitTool),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center px-4 text-sm text-slate-600">
        Loading PDF Split tool…
      </div>
    ),
  },
);

export function PdfSplitToolLazy() {
  return <PdfSplitTool />;
}
