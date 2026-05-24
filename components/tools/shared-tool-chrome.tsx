"use client";

import { ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function ToolChrome({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-24">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/#tools"
            className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All tools
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
            <Shield className="h-3.5 w-3.5" aria-hidden />
            Browser-first · private
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-slate-600 sm:text-base">
          {description}
        </p>
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}

export function DropZone({
  onFiles,
  accept,
  multiple,
  label,
  hint,
}: {
  onFiles: (files: FileList) => void;
  accept: string;
  multiple?: boolean;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white px-6 py-8 text-center transition hover:border-blue-400 hover:bg-blue-50/40">
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      {hint ? <span className="mt-1 text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export function downloadUint8(bytes: Uint8Array, filename: string, mime = "application/pdf") {
  const blob = new Blob([bytes as BlobPart], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
