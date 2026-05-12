"use client";

import imageCompression from "browser-image-compression";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Download,
  ImagePlus,
  Loader2,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { DailyPassUpsellModal } from "@/components/tools/daily-pass-upsell-modal";

const MAX_BULK = 20;

type Queued = { id: string; file: File; previewUrl: string };

type ResultRow = {
  id: string;
  originalName: string;
  outputFile: File;
  originalBytes: number;
  compressedBytes: number;
  compressedPreviewUrl: string;
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function downloadFile(file: File, downloadName: string) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = downloadName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function revokeResults(rows: ResultRow[] | null) {
  if (!rows) return;
  rows.forEach((r) => URL.revokeObjectURL(r.compressedPreviewUrl));
}

export type ImageCompressorToolProps = {
  canBulk: boolean;
};

export function ImageCompressorTool({ canBulk }: ImageCompressorToolProps) {
  const formId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [queued, setQueued] = useState<Queued[]>([]);
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [phase, setPhase] = useState<"idle" | "compressing" | "done">("idle");
  const [quality, setQuality] = useState(80);
  const [targetKb, setTargetKb] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showUpsell, setShowUpsell] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const revokeQueued = useCallback((items: Queued[]) => {
    items.forEach((q) => URL.revokeObjectURL(q.previewUrl));
  }, []);

  const queuedRef = useRef(queued);
  const resultsRef = useRef(results);

  useEffect(() => {
    queuedRef.current = queued;
    resultsRef.current = results;
  }, [queued, results]);

  useEffect(() => {
    return () => {
      revokeQueued(queuedRef.current);
      revokeResults(resultsRef.current);
    };
  }, [revokeQueued]);

  const acceptFiles = useCallback(
    (fileList: File[]) => {
      const images = fileList.filter((f) => /image\/(jpeg|png)/i.test(f.type));
      if (images.length === 0) {
        setError("Please use JPG or PNG images only.");
        return;
      }

      if (!canBulk && images.length > 1) {
        setShowUpsell(true);
      }

      const cap = canBulk ? MAX_BULK : 1;
      const picked = images.slice(0, cap);
      if (canBulk && images.length > MAX_BULK) {
        setError(`Only the first ${MAX_BULK} images were added.`);
      } else {
        setError(null);
      }

      setResults((prev) => {
        revokeResults(prev);
        return null;
      });
      setPhase("idle");
      setQueued((prev) => {
        revokeQueued(prev);
        return picked.map((file) => ({
          id: makeId(),
          file,
          previewUrl: URL.createObjectURL(file),
        }));
      });
    },
    [canBulk, revokeQueued],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (list?.length) acceptFiles([...list]);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) acceptFiles([...e.dataTransfer.files]);
  };

  const clearAll = () => {
    setQueued((prev) => {
      revokeQueued(prev);
      return [];
    });
    setResults((prev) => {
      revokeResults(prev);
      return null;
    });
    setPhase("idle");
    setError(null);
  };

  const removeOne = (id: string) => {
    setQueued((prev) => {
      const target = prev.find((q) => q.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      const next = prev.filter((q) => q.id !== id);
      return next;
    });
    setResults((prev) => {
      revokeResults(prev);
      return null;
    });
    setPhase("idle");
  };

  const compressNow = async () => {
    if (queued.length === 0) return;
    setPhase("compressing");
    setError(null);

    const raw = targetKb.trim().replace(",", ".");
    const targetNum = parseFloat(raw);
    const useTarget = raw !== "" && Number.isFinite(targetNum) && targetNum > 0;

    const options: Parameters<typeof imageCompression>[1] = {
      maxWidthOrHeight: 8192,
      useWebWorker: true,
      initialQuality: Math.min(1, Math.max(0.01, quality / 100)),
    };
    if (useTarget) {
      options.maxSizeMB = targetNum / 1024;
    }

    const rows: ResultRow[] = [];
    try {
      for (const q of queued) {
        const outputFile = await imageCompression(q.file, options);
        rows.push({
          id: q.id,
          originalName: q.file.name,
          outputFile,
          originalBytes: q.file.size,
          compressedBytes: outputFile.size,
          compressedPreviewUrl: URL.createObjectURL(outputFile),
        });
      }
      setResults((prev) => {
        revokeResults(prev);
        return rows;
      });
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong while compressing.");
      setPhase("idle");
    }
  };

  const downloadOne = (row: ResultRow) => {
    const base = row.originalName.replace(/\.[^.]+$/i, "");
    const ext = row.outputFile.type.includes("png") ? "png" : "jpg";
    downloadFile(row.outputFile, `${base}-compressed.${ext}`);
  };

  const downloadAll = async () => {
    if (!results?.length) return;
    const rows = results;
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      if (row) downloadOne(row);
      if (i < rows.length - 1) {
        await new Promise((r) => setTimeout(r, 350));
      }
    }
  };

  const totalOriginal = results?.reduce((s, r) => s + r.originalBytes, 0) ?? 0;
  const totalCompressed = results?.reduce((s, r) => s + r.compressedBytes, 0) ?? 0;
  const savedPct =
    totalOriginal > 0 ? Math.max(0, Math.round((1 - totalCompressed / totalOriginal) * 100)) : 0;

  const firstQueued = queued[0];

  return (
    <div className="min-h-screen bg-white pb-16">
      <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
          <Link
            href="/#tools"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-black"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All tools
          </Link>
          <p className="text-xs text-slate-500">
            {canBulk ? `Bulk mode: up to ${MAX_BULK} images` : "Free: 1 image at a time"}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const }}
        >
          <h1 className="text-2xl font-bold tracking-tight text-black sm:text-3xl">Image compressor</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Shrink JPG and PNG files in your browser. Nothing is uploaded—ideal for exam portals and
            government forms.
          </p>
        </motion.div>

        <div className="relative mt-8 grid gap-6 lg:grid-cols-5">
          <AnimatePresence>
            {phase === "compressing" ? (
              <motion.div
                key="busy"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/75 backdrop-blur-[2px]"
              >
                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-5 py-4 shadow-md">
                  <Loader2 className="h-6 w-6 animate-spin text-black" aria-hidden />
                  <p className="text-sm font-semibold text-black">Compressing in your browser…</p>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <motion.div
            className="space-y-6 lg:col-span-3"
            layout
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            aria-busy={phase === "compressing"}
          >
            <motion.div
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-slate-100 bg-white p-1 shadow-sm"
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png"
                multiple={canBulk}
                className="sr-only"
                aria-label="Upload images"
                onChange={onInputChange}
              />
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                disabled={phase === "compressing"}
                className={`flex min-h-[180px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-10 text-center transition sm:min-h-[220px] ${
                  dragOver
                    ? "border-black bg-slate-50"
                    : "border-slate-200 bg-slate-50/40 hover:border-slate-300 hover:bg-slate-50"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-100 bg-white text-black">
                  <ImagePlus className="h-6 w-6" aria-hidden />
                </span>
                <span className="mt-4 text-sm font-semibold text-black">
                  Drop JPG or PNG here, or tap to browse
                </span>
                <span className="mt-1 text-xs text-slate-500">
                  {canBulk ? `Up to ${MAX_BULK} files per batch` : "One file on the free plan"}
                </span>
              </button>
            </motion.div>

            {queued.length > 0 ? (
              <motion.ul
                className="space-y-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.05 }}
              >
                {queued.map((q) => (
                  <motion.li
                    key={q.id}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- blob preview */}
                    <img
                      src={q.previewUrl}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-black">{q.file.name}</p>
                      <p className="text-xs text-slate-500">{formatBytes(q.file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeOne(q.id)}
                      disabled={phase === "compressing"}
                      className="shrink-0 rounded-lg border border-slate-100 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-black disabled:opacity-40"
                      aria-label={`Remove ${q.file.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </motion.li>
                ))}
              </motion.ul>
            ) : null}

            {error ? (
              <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
                {error}
              </p>
            ) : null}
          </motion.div>

          <motion.aside
            className="space-y-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:col-span-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const }}
          >
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Settings</h2>
            <div>
              <label htmlFor={`${formId}-quality`} className="text-sm font-medium text-black">
                Compression quality ({quality}%)
              </label>
              <input
                id={`${formId}-quality`}
                type="range"
                min={1}
                max={100}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                disabled={phase === "compressing"}
                className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-black disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor={`${formId}-target`} className="text-sm font-medium text-black">
                Target file size (KB)
              </label>
              <input
                id={`${formId}-target`}
                type="text"
                inputMode="decimal"
                placeholder="e.g. 200 (optional)"
                value={targetKb}
                onChange={(e) => setTargetKb(e.target.value)}
                disabled={phase === "compressing"}
                className="mt-2 w-full rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2.5 text-sm text-black outline-none ring-black/5 placeholder:text-slate-400 focus:border-slate-200 focus:ring-2 disabled:opacity-50"
              />
              <p className="mt-1 text-xs text-slate-500">
                Leave empty to optimize with quality only. Target size is a best-effort cap.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => void compressNow()}
                disabled={queued.length === 0 || phase === "compressing"}
                className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {phase === "compressing" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Compressing…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" aria-hidden />
                    Compress now
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={clearAll}
                disabled={(queued.length === 0 && !results) || phase === "compressing"}
                className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                Clear all
              </button>
            </div>
          </motion.aside>
        </div>

        <AnimatePresence>
          {phase === "done" && results && results.length > 0 ? (
            <motion.section
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="mt-10 rounded-2xl border border-slate-100 bg-slate-50/60 p-5 sm:p-8"
            >
              <h2 className="text-lg font-bold text-black sm:text-xl">Results</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Original total</p>
                  <p className="mt-1 text-2xl font-bold text-black">{formatBytes(totalOriginal)}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Compressed total
                  </p>
                  <p className="mt-1 text-2xl font-bold text-black">{formatBytes(totalCompressed)}</p>
                </div>
              </div>
              <p className="mt-4 text-sm font-medium text-emerald-800">
                Space saved: about {savedPct}% smaller overall
              </p>

              {results.length === 1 && results[0] && firstQueued ? (
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Original</p>
                    <div className="mt-2 overflow-hidden rounded-xl border border-slate-100 bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element -- blob preview */}
                      <img
                        src={firstQueued.previewUrl}
                        alt="Original preview"
                        className="max-h-56 w-full object-contain"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Compressed</p>
                    <div className="mt-2 overflow-hidden rounded-xl border border-slate-100 bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element -- blob preview */}
                      <img
                        src={results[0].compressedPreviewUrl}
                        alt="Compressed preview"
                        className="max-h-56 w-full object-contain"
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                {results.length === 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      const r = results[0];
                      if (r) downloadOne(r);
                    }}
                    className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 sm:max-w-sm"
                  >
                    <Download className="h-4 w-4" aria-hidden />
                    Download compressed image
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void downloadAll()}
                    className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 sm:w-auto sm:flex-1"
                  >
                    <Download className="h-4 w-4" aria-hidden />
                    Download all ({results.length})
                  </button>
                )}
              </div>

              <ul className="mt-8 space-y-3 border-t border-slate-100 pt-6">
                {results.map((row) => {
                  const rowPct =
                    row.originalBytes > 0
                      ? Math.round((1 - row.compressedBytes / row.originalBytes) * 100)
                      : 0;
                  return (
                    <li
                      key={row.id}
                      className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-black">{row.originalName}</p>
                        <p className="mt-1 text-xs text-slate-600">
                          {formatBytes(row.originalBytes)} → {formatBytes(row.compressedBytes)}
                          <span className="text-emerald-700"> ({rowPct}% saved)</span>
                        </p>
                      </div>
                      {results.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => downloadOne(row)}
                          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-black transition hover:bg-slate-50 sm:text-sm"
                        >
                          <Download className="h-4 w-4" aria-hidden />
                          Download
                        </button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </motion.section>
          ) : null}
        </AnimatePresence>
      </div>

      <DailyPassUpsellModal open={showUpsell} onClose={() => setShowUpsell(false)} />
    </div>
  );
}
