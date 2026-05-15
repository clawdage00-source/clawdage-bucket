"use client";

import dynamic from "next/dynamic";

/** Client-only: keeps PDF to Excel UI out of SSR (dynamic import). */
export const PdfToExcelToolLazy = dynamic(
  () => import("@/components/tools/pdf-to-excel-tool").then((m) => m.PdfToExcelTool),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center px-4 text-sm text-slate-600">
        Loading PDF to Excel tool…
      </div>
    ),
  },
);