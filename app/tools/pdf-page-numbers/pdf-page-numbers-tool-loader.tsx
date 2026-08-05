"use client";

import dynamic from "next/dynamic";

const PdfPageNumbersTool = dynamic(
  () =>
    import("@/components/tools/pdf-page-numbers-tool").then(
      (module) => module.PdfPageNumbersTool,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center px-4 text-sm text-slate-600">
        Loading PDF page numbers tool…
      </div>
    ),
  },
);

export function PdfPageNumbersToolLazy() {
  return <PdfPageNumbersTool />;
}
