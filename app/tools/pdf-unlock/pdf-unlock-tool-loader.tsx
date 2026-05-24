"use client";

import dynamic from "next/dynamic";

const PdfUnlockTool = dynamic(
  () => import("@/components/tools/pdf-unlock-tool").then((m) => m.PdfUnlockTool),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center px-4 text-sm text-slate-600">
        Loading PDF Unlock tool…
      </div>
    ),
  },
);

export function PdfUnlockToolLazy() {
  return <PdfUnlockTool />;
}
