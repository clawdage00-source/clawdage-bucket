"use client";

import dynamic from "next/dynamic";

/** Client-only: avoids pulling `@xenova/transformers` / ONNX through Node SSR (fixes fs/path + ort-web.node). */
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
