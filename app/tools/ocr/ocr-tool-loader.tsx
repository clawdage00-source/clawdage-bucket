"use client";

import dynamic from "next/dynamic";

/** Client-only: keeps OCR UI out of SSR (dynamic import). */
export const OcrToolLazy = dynamic(
  () => import("@/components/tools/ocr-tool").then((m) => m.OcrTool),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center px-4 text-sm text-slate-600">
        Loading OCR tool…
      </div>
    ),
  },
);
