"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  Download,
  GripVertical,
  ImagePlus,
  Loader2,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { getBgRemoverEligibility, recordBgRemoverUsage } from "@/actions/bg-remover-usage";
import type { BgRemoverEligibility } from "@/lib/bg-remover-usage-shared";
import { DailyPassUpsellModal } from "@/components/tools/daily-pass-upsell-modal";
import { processImage } from "@/lib/bg-remover-process";

const ACCEPT = "image/*";
const RASTER_EXT = /\.(jpe?g|png|bmp|webp|gif|tiff?|tif|avif|heic|heif|ico|jxl)$/i;

const ANON_STORAGE_KEY = "clawdage-bg-remover-anon-usage";
const FREE_DAILY_LIMIT = 3;

const EXPORT_SOLIDS = [
  { id: "transparent" as const, label: "Transparent", hex: null },
  { id: "white" as const, label: "White", hex: "#ffffff" },
  { id: "black" as const, label: "Black", hex: "#000000" },
  { id: "blue" as const, label: "Blue", hex: "#1d4ed8" },
];

function isRasterImageFile(file: File): boolean {
  const t = file.type.toLowerCase();
  if (t === "image/svg+xml" || t === "image/svg") return false;
  if (t.startsWith("image/")) return true;
  return RASTER_EXT.test(file.name);
}

function utcDayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getAnonUsage(): { day: string; count: number } {
  if (typeof window === "undefined") return { day: utcDayKey(), count: 0 };
  try {
    const raw = localStorage.getItem(ANON_STORAGE_KEY);
    if (!raw) return { day: utcDayKey(), count: 0 };
    const j = JSON.parse(raw) as { day?: string; count?: number };
    const day = typeof j.day === "string" ? j.day : utcDayKey();
    const count = typeof j.count === "number" && Number.isFinite(j.count) ? j.count : 0;
    if (day !== utcDayKey()) return { day: utcDayKey(), count: 0 };
    return { day, count };
  } catch {
    return { day: utcDayKey(), count: 0 };
  }
}

function bumpAnonUsage(): void {
  const day = utcDayKey();
  const prev = getAnonUsage();
  const count = prev.day === day ? prev.count + 1 : 1;
  localStorage.setItem(ANON_STORAGE_KEY, JSON.stringify({ day, count }));
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function compositeSolidPng(transparentBlob: Blob, hex: string): Promise<Blob> {
  const bitmap = await createImageBitmap(transparentBlob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const out = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/png"),
  );
  if (!out) throw new Error("Could not encode PNG");
  return out;
}

const LOADING_HINTS = [
  "Loading neural weights into your browser…",
  "AI is analyzing edges and color boundaries…",
  "Almost there — building a clean alpha mask…",
];

export type BgRemoverToolProps = {
  initialEligibility: BgRemoverEligibility;
};

export function BgRemoverTool({ initialEligibility }: BgRemoverToolProps) {
  const formId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const compareTrackRef = useRef<HTMLDivElement>(null);
  const compareDraggingRef = useRef(false);
  const removalRunRef = useRef(0);
  const [file, setFile] = useState<File | null>(null);
  const [beforeUrl, setBeforeUrl] = useState<string | null>(null);
  const [afterUrl, setAfterUrl] = useState<string | null>(null);
  const [transparentBlob, setTransparentBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string | null>(null);
  const [hintIdx, setHintIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [comparePct, setComparePct] = useState(50);
  const [compareDragging, setCompareDragging] = useState(false);
  const [compareMode, setCompareMode] = useState<"slider" | "toggle">("slider");
  const [showAfterToggle, setShowAfterToggle] = useState(true);
  const [exportSolid, setExportSolid] = useState<(typeof EXPORT_SOLIDS)[number]["id"]>("transparent");
  const [eligibility, setEligibility] = useState(initialEligibility);
  const [upsellOpen, setUpsellOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (beforeUrl) URL.revokeObjectURL(beforeUrl);
      if (afterUrl) URL.revokeObjectURL(afterUrl);
    };
  }, [beforeUrl, afterUrl]);

  useEffect(() => {
    if (!busy) return;
    const t = window.setInterval(() => {
      setHintIdx((i) => (i + 1) % LOADING_HINTS.length);
    }, 2800);
    return () => window.clearInterval(t);
  }, [busy]);

  const refreshEligibility = useCallback(async () => {
    setEligibility(await getBgRemoverEligibility());
  }, []);

  const clearAll = useCallback(() => {
    removalRunRef.current += 1;
    setBusy(false);
    if (beforeUrl) URL.revokeObjectURL(beforeUrl);
    if (afterUrl) URL.revokeObjectURL(afterUrl);
    setFile(null);
    setBeforeUrl(null);
    setAfterUrl(null);
    setTransparentBlob(null);
    setError(null);
    setProgressMsg(null);
    setComparePct(50);
    setShowAfterToggle(true);
    setExportSolid("transparent");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [beforeUrl, afterUrl]);

  const gateOrProceed = useCallback((): boolean => {
    if (eligibility.unlimited) return true;
    if (eligibility.isLoggedIn && !eligibility.allowed) {
      setUpsellOpen(true);
      return false;
    }
    if (!eligibility.isLoggedIn) {
      const { count } = getAnonUsage();
      if (count >= FREE_DAILY_LIMIT) {
        setUpsellOpen(true);
        return false;
      }
    }
    return true;
  }, [eligibility]);

  const runRemoval = useCallback(
    async (nextFile: File) => {
      if (!gateOrProceed()) return;
      const runId = removalRunRef.current;
      setError(null);
      setBusy(true);
      setProgressMsg("Preparing image…");
      try {
        const blob = await processImage(nextFile, (m) => setProgressMsg(m));
        if (runId !== removalRunRef.current) return;
        if (afterUrl) URL.revokeObjectURL(afterUrl);
        const url = URL.createObjectURL(blob);
        setTransparentBlob(blob);
        setAfterUrl(url);
        setProgressMsg(null);

        if (eligibility.isLoggedIn) {
          const log = await recordBgRemoverUsage();
          if (!log.ok && process.env.NODE_ENV === "development") {
            console.warn("[bg-remover] usage log:", log.error);
          }
          await refreshEligibility();
        } else {
          bumpAnonUsage();
        }
      } catch (e) {
        if (runId !== removalRunRef.current) return;
        const msg = e instanceof Error ? e.message : "Background removal failed.";
        setError(msg);
        setAfterUrl(null);
        setTransparentBlob(null);
      } finally {
        if (runId === removalRunRef.current) {
          setBusy(false);
        }
      }
    },
    [afterUrl, eligibility.isLoggedIn, gateOrProceed, refreshEligibility],
  );

  const onPickFiles = useCallback(
    (list: FileList | null) => {
      const f = list?.[0];
      if (!f || !isRasterImageFile(f)) {
        setError("Choose a raster image (JPG, PNG, WebP, etc.).");
        return;
      }
      if (!gateOrProceed()) return;
      clearAll();
      setFile(f);
      const u = URL.createObjectURL(f);
      setBeforeUrl(u);
      void runRemoval(f);
    },
    [clearAll, gateOrProceed, runRemoval],
  );

  const onDownload = useCallback(async () => {
    if (!transparentBlob) return;
    const base = (file?.name ?? "image").replace(/\.[^.]+$/, "");
    try {
      if (exportSolid === "transparent") {
        downloadBlob(transparentBlob, `${base}-no-bg.png`);
        return;
      }
      const solid = EXPORT_SOLIDS.find((s) => s.id === exportSolid);
      const hex = solid?.hex;
      if (!hex) {
        downloadBlob(transparentBlob, `${base}-no-bg.png`);
        return;
      }
      setBusy(true);
      setProgressMsg("Preparing download…");
      const out = await compositeSolidPng(transparentBlob, hex);
      downloadBlob(out, `${base}-${exportSolid}-bg.png`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed.");
    } finally {
      setBusy(false);
      setProgressMsg(null);
    }
  }, [exportSolid, file?.name, transparentBlob]);

  const checkerStyle: React.CSSProperties = {
    backgroundColor: "#e2e8f0",
    backgroundImage: `
      linear-gradient(45deg, #cbd5e1 25%, transparent 25%),
      linear-gradient(-45deg, #cbd5e1 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #cbd5e1 75%),
      linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)`,
    backgroundSize: "20px 20px",
    backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
  };

  const previewBg =
    exportSolid === "white"
      ? { backgroundColor: "#ffffff" }
      : exportSolid === "black"
        ? { backgroundColor: "#000000" }
        : exportSolid === "blue"
          ? { backgroundColor: "#1d4ed8" }
          : checkerStyle;

  const clipTransition =
    compareDragging ? "none" : "clip-path 0.22s cubic-bezier(0.4, 0, 0.2, 1), left 0.22s cubic-bezier(0.4, 0, 0.2, 1)";

  const setCompareFromClientX = useCallback((clientX: number) => {
    const el = compareTrackRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = Math.min(Math.max(0, clientX - r.left), r.width);
    setComparePct(r.width > 0 ? Math.round((x / r.width) * 100) : 50);
  }, []);

  const onComparePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!afterUrl || compareMode !== "slider") return;
      e.preventDefault();
      compareDraggingRef.current = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      setCompareDragging(true);
      setCompareFromClientX(e.clientX);
    },
    [afterUrl, compareMode, setCompareFromClientX],
  );

  const onComparePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!compareDraggingRef.current) return;
      setCompareFromClientX(e.clientX);
    },
    [setCompareFromClientX],
  );

  const endCompareDrag = useCallback(() => {
    compareDraggingRef.current = false;
    setCompareDragging(false);
  }, []);

  const onComparePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    }
    endCompareDrag();
  }, [endCompareDrag]);

  return (
    <div className="min-h-screen bg-[#fafafa] pb-20">
      <div className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-start gap-3">
            <Link
              href="/#tools"
              className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50"
              aria-label="Back to tools"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight text-black sm:text-2xl">
                  AI Background Remover
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-900">
                  <Sparkles className="h-3 w-3" aria-hidden />
                  Powered by Local AI
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                Private in-browser processing — your image never leaves this device for removal.
              </p>
              {!eligibility.unlimited && eligibility.isLoggedIn ? (
                <p className="mt-2 text-xs text-slate-500">
                  Free plan: {Math.max(0, FREE_DAILY_LIMIT - eligibility.usedToday)} of {FREE_DAILY_LIMIT}{" "}
                  removals left today (UTC).
                </p>
              ) : null}
              {!eligibility.unlimited && !eligibility.isLoggedIn ? (
                <p className="mt-2 text-xs text-slate-500">
                  Guest: {Math.max(0, FREE_DAILY_LIMIT - getAnonUsage().count)} of {FREE_DAILY_LIMIT} free
                  removals today on this browser.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
          <input
            ref={fileInputRef}
            id={formId}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            onChange={(e) => onPickFiles(e.target.files)}
          />

          <div className="space-y-6">
            {/* Empty upload — only when no preview yet */}
            {!beforeUrl ? (
              <label
                htmlFor={formId}
                className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-4 py-12 text-center transition hover:border-slate-300 hover:bg-slate-50"
              >
                <ImagePlus className="h-10 w-10 text-slate-400" aria-hidden />
                <p className="mt-3 text-sm font-semibold text-black">Drop an image here or click to upload</p>
                <p className="mt-1 text-xs text-slate-500">JPG, PNG, WebP — processed entirely in your browser.</p>
              </label>
            ) : null}

            {error && !beforeUrl ? (
              <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-900">{error}</div>
            ) : null}

            {/* Preview: original while processing; before/after when done */}
            {beforeUrl ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {afterUrl ? (
                    <div className="inline-flex rounded-lg border border-slate-200 p-0.5 text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => setCompareMode("slider")}
                        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 ${
                          compareMode === "slider" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        Compare slider
                      </button>
                      <button
                        type="button"
                        onClick={() => setCompareMode("toggle")}
                        className={`rounded-md px-2.5 py-1.5 ${
                          compareMode === "toggle" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        Before / After
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-slate-700">Preview</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <label
                      htmlFor={formId}
                      className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-black transition hover:bg-slate-50 ${
                        busy ? "pointer-events-none opacity-50" : ""
                      }`}
                    >
                      <RefreshCw className="h-4 w-4" />
                      New image
                    </label>
                    <button
                      type="button"
                      onClick={clearAll}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear
                    </button>
                  </div>
                </div>

                <div
                  className="relative overflow-hidden rounded-xl border border-slate-100 bg-slate-100"
                  style={afterUrl ? previewBg : { backgroundColor: "#0f172a" }}
                >
                  {!afterUrl ? (
                    <div className="relative">
                      <img
                        src={beforeUrl}
                        alt="Original preview"
                        className="block max-h-[min(70vh,560px)] w-full object-contain"
                        draggable={false}
                      />
                      {busy ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/55 backdrop-blur-[3px]">
                          <motion.div
                            className="pointer-events-none absolute inset-x-[12%] h-28 rounded-full bg-gradient-to-b from-emerald-400/35 via-cyan-400/20 to-transparent blur-md"
                            animate={{ top: ["8%", "52%", "8%"] }}
                            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                          />
                          <motion.div
                            className="pointer-events-none absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"
                            animate={{ top: ["12%", "88%", "12%"] }}
                            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                          />
                          <div className="relative z-[1] flex flex-col items-center gap-4 px-6 text-center">
                            <div className="relative">
                              <Loader2
                                className="h-12 w-12 animate-spin text-white drop-shadow-md"
                                aria-hidden
                              />
                              <Sparkles className="absolute -right-1 -top-1 h-5 w-5 text-emerald-300" aria-hidden />
                            </div>
                            <div>
                              <p className="text-base font-semibold tracking-tight text-white drop-shadow">
                                {progressMsg ?? "Analyzing your image…"}
                              </p>
                              <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/85">
                                {LOADING_HINTS[hintIdx]}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : beforeUrl && afterUrl && compareMode === "slider" ? (
                    <div
                      ref={compareTrackRef}
                      role="slider"
                      aria-valuenow={comparePct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Drag to compare original and background removed"
                      className="relative w-full cursor-ew-resize touch-none select-none"
                      onPointerDown={onComparePointerDown}
                      onPointerMove={onComparePointerMove}
                      onPointerUp={onComparePointerUp}
                      onPointerCancel={onComparePointerUp}
                      onLostPointerCapture={endCompareDrag}
                    >
                      <img src={beforeUrl} alt="" className="block w-full object-contain" draggable={false} />
                      <img
                        src={afterUrl}
                        alt=""
                        className="pointer-events-none absolute inset-0 h-full w-full object-contain"
                        style={{
                          clipPath: `inset(0 ${100 - comparePct}% 0 0)`,
                          transition: clipTransition,
                        }}
                        draggable={false}
                      />
                      <div
                        className="pointer-events-none absolute inset-y-0 z-[2] flex w-10 -translate-x-1/2 items-center justify-center"
                        style={{
                          left: `${comparePct}%`,
                          transition: clipTransition,
                        }}
                      >
                        <div className="flex h-14 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-900/90 text-white shadow-lg ring-4 ring-black/15">
                          <GripVertical className="h-5 w-5 opacity-90" aria-hidden />
                        </div>
                      </div>
                      <div
                        className="pointer-events-none absolute inset-y-0 z-[1] w-px bg-white/95 shadow-[0_0_20px_rgba(0,0,0,0.35)]"
                        style={{
                          left: `${comparePct}%`,
                          transform: "translateX(-50%)",
                          transition: clipTransition,
                        }}
                      />
                    </div>
                  ) : beforeUrl && afterUrl ? (
                    <button
                      type="button"
                      onClick={() => setShowAfterToggle((v) => !v)}
                      className="relative block w-full outline-none"
                    >
                      <img
                        src={showAfterToggle ? afterUrl : beforeUrl}
                        alt=""
                        className="block w-full object-contain"
                      />
                      <span className="absolute bottom-3 left-3 rounded-md bg-black/75 px-2 py-1 text-xs font-medium text-white">
                        Tap to show {showAfterToggle ? "original" : "removed background"}
                      </span>
                    </button>
                  ) : null}
                </div>

                {compareMode === "slider" && beforeUrl && afterUrl ? (
                  <div className="space-y-2 px-0.5">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Original</span>
                      <span>Background removed</span>
                    </div>
                    <label className="sr-only" htmlFor={`${formId}-compare`}>
                      Compare position
                    </label>
                    <input
                      id={`${formId}-compare`}
                      type="range"
                      min={0}
                      max={100}
                      value={comparePct}
                      onPointerDown={() => {
                        compareDraggingRef.current = true;
                        setCompareDragging(true);
                      }}
                      onPointerUp={() => {
                        compareDraggingRef.current = false;
                        setCompareDragging(false);
                      }}
                      onChange={(e) => setComparePct(Number(e.target.value))}
                      className="h-3 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-900 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-slate-900 [&::-webkit-slider-thumb]:shadow-md"
                      style={{
                        background: `linear-gradient(to right, rgb(15 23 42) 0%, rgb(15 23 42) ${comparePct}%, rgb(226 232 240) ${comparePct}%, rgb(226 232 240) 100%)`,
                      }}
                    />
                  </div>
                ) : null}

                {afterUrl ? (
                  <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Export background</p>
                    <div className="flex flex-wrap gap-2">
                      {EXPORT_SOLIDS.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setExportSolid(s.id)}
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                            exportSolid === s.id
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      disabled={busy || !transparentBlob}
                      onClick={() => void onDownload()}
                      className="inline-flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-40"
                    >
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      Download PNG
                    </button>
                  </div>
                ) : null}

                {busy && !afterUrl ? (
                  <p className="text-center text-xs text-slate-500">
                    First run downloads the AI model — please keep this tab open.
                  </p>
                ) : null}

                {busy && afterUrl ? (
                  <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm text-slate-600">
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                    {progressMsg ?? "Please wait…"}
                  </div>
                ) : null}

                {error ? (
                  <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-900">
                    {error}
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Need more than {FREE_DAILY_LIMIT} removals a day? A Daily Pass unlocks unlimited tool access for your
          account.
        </p>
      </div>

      <DailyPassUpsellModal
        open={upsellOpen}
        onClose={() => setUpsellOpen(false)}
        title="Daily Pass — ₹19"
        description={
          <>
            You&apos;ve used your{" "}
            <span className="font-medium text-black">{FREE_DAILY_LIMIT} free background removals</span> for today.
            Upgrade with a <span className="font-medium text-black">Daily Pass from ₹19</span> for unlimited removals
            and other Pro workflows, or come back tomorrow.
          </>
        }
        secondaryActionLabel="Close"
      />
    </div>
  );
}
