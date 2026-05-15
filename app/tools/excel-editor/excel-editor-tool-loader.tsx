"use client";

import dynamic from "next/dynamic";

/** Client-only: keeps Excel Editor UI out of SSR (dynamic import). */
export const ExcelEditorToolLazy = dynamic(
  () => import("@/components/tools/excel-editor-tool").then((m) => m.ExcelEditorTool),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center px-4 text-sm text-slate-600">
        Loading Excel editor…
      </div>
    ),
  },
);