"use client";

import dynamic from "next/dynamic";

export const PassportPhotoToolLazy = dynamic(
  () => import("@/components/tools/passport-photo-tool").then((m) => m.PassportPhotoTool),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center px-4 text-sm text-slate-600">
        Loading Passport Photo Maker…
      </div>
    ),
  },
);
