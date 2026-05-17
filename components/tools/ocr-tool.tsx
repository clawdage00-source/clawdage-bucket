"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCopy,
  Cloud,
  Columns2,
  ImagePlus,
  Loader2,
  Lock,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { runGroqVisionOcrWithLang } from "@/actions/groq-ocr";
import { DailyPassUpsellModal } from "@/components/tools/daily-pass-upsell-modal";

const ACCEPT = "image/*";
const RASTER_EXT = /\.(jpe?g|png|bmp|webp|gif|tiff?|tif|avif|heic|heif|ico|jxl)$/i;

function isRasterImageFile(file: File): boolean {
  const t = file.type.toLowerCase();
  if (t === "image/svg+xml" || t === "image/svg") return false;
  if (t.startsWith("image/")) return true;
  return RASTER_EXT.test(file.name);
}

type OcrItem = {
  id: string;
  file: File;
  previewUrl: string;
  text: string;
};

type ProgressState = { message: string; percent: number };

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function buildTypewriterPartial(lines: string[], lineIdx: number, charIdx: number): string {
  let s = "";
  for (let i = 0; i < lineIdx; i += 1) {
    s += lines[i] ?? "";
    s += "\n";
  }
  s += (lines[lineIdx] ?? "").slice(0, charIdx);
  return s;
}

async function fileToJpegDataUrl(source: Blob | File, maxDim: number): Promise<string> {
  const bitmap = await createImageBitmap(source);
  let w = bitmap.width;
  let h = bitmap.height;
  const scale = Math.min(1, maxDim / Math.max(w, h));
  w = Math.round(w * scale);
  h = Math.round(h * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.88);
}

function humanizeLanguageTag(tag: string): string {
  const t = tag.trim();
  if (!t || t === "und") return "Unknown / mixed";
  try {
    const dn = new Intl.DisplayNames(["en"], { type: "language" });
    const primary = t.split("-")[0];
    if (!primary) return t;
    const label = dn.of(primary);
    return label && label !== primary ? `${label} (${t})` : t.toUpperCase();
  } catch {
    return t;
  }
}

export type OcrToolProps = {
  isPro: boolean;
};

export function OcrTool({ isPro }: OcrToolProps) {
  const formId = useId();
  const itemsRef = useRef<OcrItem[]>([]);
  const processedItemIdRef = useRef<string | null>(null);

  const [items, setItems] = useState<OcrItem[]>([]);
  const [combinedText, setCombinedText] = useState("");
  const [detectedLang, setDetectedLang] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyDone, setCopyDone] = useState(false);
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [noteAnimKey, setNoteAnimKey] = useState(0);
  const [previewText, setPreviewText] = useState("");
  const [typingDone, setTypingDone] = useState(true);
  const typingTimerRef = useRef<number | null>(null);
  const lastJoinedOcrRef = useRef("");
  const [compareOpen, setCompareOpen] = useState(false);

  const selected = items[0];

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    if (items.length === 0) setCompareOpen(false);
  }, [items.length]);

  useEffect(() => {
    if (!compareOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setCompareOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [compareOpen]);

  useEffect(() => {
    const clearTimer = () => {
      if (typingTimerRef.current != null) {
        window.clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
    };

    clearTimer();

    let cancelled = false;

    const bootId = window.setTimeout(() => {
      if (cancelled) return;

      const full = lastJoinedOcrRef.current;
      if (!full) {
        setPreviewText("");
        setTypingDone(true);
        return;
      }

      setTypingDone(false);
      setPreviewText("");

      const lines = full.split(/\r?\n/);
      const totalChars = full.length;
      /** One character at a time for a pen-on-paper feel. */
      const charsPerTick = 1;
      const charDelayMs = Math.max(22, Math.min(52, Math.floor(16000 / Math.max(1, totalChars))));
      const pauseBetweenLinesMs = 88;

      let lineIdx = 0;
      let charIdx = 0;

      const finish = () => {
        if (cancelled) return;
        setPreviewText(full);
        setCombinedText(full);
        setTypingDone(true);
      };

      const step = () => {
        if (cancelled) return;
        typingTimerRef.current = null;
        const line = lines[lineIdx] ?? "";

        if (charIdx < line.length) {
          charIdx = Math.min(line.length, charIdx + charsPerTick);
          setPreviewText(buildTypewriterPartial(lines, lineIdx, charIdx));
          typingTimerRef.current = window.setTimeout(step, charDelayMs);
          return;
        }

        if (lineIdx + 1 >= lines.length) {
          finish();
          return;
        }

        lineIdx += 1;
        charIdx = 0;
        setPreviewText(buildTypewriterPartial(lines, lineIdx, charIdx));
        typingTimerRef.current = window.setTimeout(step, pauseBetweenLinesMs);
      };

      typingTimerRef.current = window.setTimeout(step, charDelayMs);
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(bootId);
      clearTimer();
    };
  }, [noteAnimKey]);

  const revokeItems = useCallback((list: OcrItem[]) => {
    list.forEach((i) => URL.revokeObjectURL(i.previewUrl));
  }, []);

  const clearAll = useCallback(() => {
    revokeItems(itemsRef.current);
    processedItemIdRef.current = null;
    setItems([]);
    setCombinedText("");
    setDetectedLang(null);
    lastJoinedOcrRef.current = "";
    setPreviewText("");
    setTypingDone(true);
    setCompareOpen(false);
    setProgress(null);
    setError(null);
  }, [revokeItems]);

  const runGroqExtract = useCallback(
    async (file: File, itemId: string) => {
      if (!isPro) {
        setUpsellOpen(true);
        return;
      }
      setBusy(true);
      setError(null);
      setCopyDone(false);
      setCompareOpen(false);
      setProgress({ message: "Groq AI is reading your handwriting...", percent: 8 });

      try {
        const dataUrl = await fileToJpegDataUrl(file, 1800);
        setProgress({ message: "Groq AI is reading your handwriting...", percent: 40 });
        const result = await runGroqVisionOcrWithLang(dataUrl);
        if (!result.ok) {
          if (result.code === "PRO_REQUIRED") setUpsellOpen(true);
          throw new Error(result.error);
        }
        setDetectedLang(result.language);
        const text = result.text;
        setCombinedText("");
        setPreviewText("");
        lastJoinedOcrRef.current = text;
        setNoteAnimKey((k) => k + 1);
        setItems((prev) => prev.map((row) => (row.id === itemId ? { ...row, text } : row)));
        setProgress({ message: "Done", percent: 100 });
        window.setTimeout(() => setProgress(null), 900);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        setProgress(null);
      } finally {
        setBusy(false);
      }
    },
    [isPro],
  );

  const addFiles = useCallback(
    (fileList: File[]) => {
      const allowed = fileList.filter(isRasterImageFile);
      if (allowed.length === 0) {
        setError("Use a raster image (e.g. JPG, PNG, WebP). SVG is not supported.");
        return;
      }
      const file = allowed[0]!;
      if (allowed.length > 1) {
        setError("Only one image at a time. Using the first file.");
      } else {
        setError(null);
      }

      revokeItems(itemsRef.current);
      processedItemIdRef.current = null;
      const id = makeId();
      setItems([
        {
          id,
          file,
          previewUrl: URL.createObjectURL(file),
          text: "",
        },
      ]);
      setCombinedText("");
      setDetectedLang(null);
      lastJoinedOcrRef.current = "";
      setPreviewText("");
      setTypingDone(true);
      setProgress(null);
      setCompareOpen(false);
    },
    [revokeItems],
  );

  useEffect(() => {
    if (!isPro || items.length !== 1) return;
    const item = items[0]!;
    if (processedItemIdRef.current === item.id) return;
    processedItemIdRef.current = item.id;
    void runGroqExtract(item.file, item.id);
  }, [items, isPro, runGroqExtract]);

  const copyText = async () => {
    const text = typingDone ? combinedText : lastJoinedOcrRef.current;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopyDone(true);
      window.setTimeout(() => setCopyDone(false), 2000);
    } catch {
      setError("Clipboard not available. Select the text and copy manually.");
    }
  };

  const onVerificationChange = (v: string) => {
    setCombinedText(v);
    setItems((prev) => (prev.length === 1 ? [{ ...prev[0]!, text: v }] : prev));
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-card pb-20">
      <div className="border-b border-border bg-muted/50 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-[90rem] flex-wrap items-center justify-between gap-3">
          <Link
            href="/#tools"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All tools
          </Link>
          <p className="text-xs text-muted-foreground">
            {isPro ? "Pro: Groq AI handwriting OCR + auto language detection" : "Free: preview upload · pass unlocks AI extraction"}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6 sm:py-10">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">AI Handwriting OCR (Pro)</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Upload an image. With an active pass, Groq Vision extracts text, detects the document language automatically,
            and streams the transcript here. Images are sent to Groq for processing.
          </p>
        </motion.div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-8">
          <motion.div layout className="space-y-4">
            <div
              role="button"
              tabIndex={0}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                addFiles(Array.from(e.dataTransfer.files));
              }}
              className={`rounded-2xl border-2 border-dashed p-6 transition ${
                dragOver ? "border-primary bg-muted" : "border-border bg-muted/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <ImagePlus className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">Drop an image here</p>
                  <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, WebP, GIF, TIFF, BMP · one file</p>
                  <input
                    id={`${formId}-file`}
                    type="file"
                    accept={ACCEPT}
                    className="sr-only"
                    onChange={(e) => {
                      const fl = e.target.files;
                      e.target.value = "";
                      if (fl?.length) addFiles(Array.from(fl));
                    }}
                  />
                  <label
                    htmlFor={`${formId}-file`}
                    className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Browse file
                  </label>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Cloud className="h-4 w-4 text-sky-600" aria-hidden />
                <p className="text-sm font-medium text-foreground">Cloud AI</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                AI Mode processes images via Groq&apos;s secure servers. Language is detected automatically when extraction
                runs.
              </p>
              {!isPro ? (
                <button
                  type="button"
                  onClick={() => setUpsellOpen(true)}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-950 transition hover:bg-amber-100"
                >
                  <Lock className="h-3.5 w-3.5" aria-hidden />
                  Unlock extraction — Daily Pass from ₹19
                </button>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy || !selected || !isPro}
                onClick={() => selected && void runGroqExtract(selected.file, selected.id)}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-40"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="h-4 w-4" aria-hidden />}
                Run again
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={clearAll}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                Clear
              </button>
            </div>

            <AnimatePresence>
              {progress ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm"
                >
                  <p className="text-xs font-medium text-muted-foreground">{progress.message}</p>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full bg-black"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress.percent}%` }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {error ? (
              <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-900">
                <X className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{error}</span>
              </div>
            ) : null}
          </motion.div>

          <motion.div layout className="flex min-h-0 flex-col gap-4">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Original</p>
              <p className="text-xs text-muted-foreground">Your upload — extracted text appears in the note below.</p>
              <div className="mt-4 max-h-[min(56vh,32rem)] overflow-auto rounded-xl border border-border bg-muted/80 p-2">
                {selected ? (
                  <motion.div
                    key={selected.id}
                    initial={{ opacity: 0.85 }}
                    animate={{ opacity: 1 }}
                    className="relative flex min-h-[220px] w-full min-w-0 items-start justify-center overflow-hidden rounded-lg bg-neutral-200 py-4"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selected.previewUrl}
                      alt="Upload preview"
                      className="relative z-0 max-h-[min(70vh,48rem)] max-w-full object-contain px-1"
                    />
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,transparent_35%,transparent_65%,rgba(0,0,0,0.05)_100%)]"
                    />
                  </motion.div>
                ) : (
                  <div className="flex min-h-[220px] items-center justify-center text-sm text-muted-foreground">No image yet</div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Full-width lined paper — white bg, transparent writing area */}
      <section
        className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen max-w-[100vw] overflow-x-hidden border-y border-border bg-card py-10 sm:py-12"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(148, 163, 184, 0.22) 40px, transparent 40px), repeating-linear-gradient(
            transparent,
            transparent 27px,
            rgba(15, 23, 42, 0.045) 27px,
            rgba(15, 23, 42, 0.045) 28px
          )`,
          backgroundSize: "100% 100%, 100% 28px",
          backgroundAttachment: "local, local",
        }}
      >
        <div className="relative mx-auto w-full max-w-[90rem] px-4 sm:px-6">
          <div className="pl-10 sm:pl-12">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
              <div>
                <p className="font-serif text-lg font-semibold tracking-tight text-foreground sm:text-xl">Extracted text</p>
                <p className="mt-1 font-serif text-xs italic text-muted-foreground">Typed onto the page as the AI finishes</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {isPro && typingDone && combinedText.trim() && selected ? (
                  <button
                    type="button"
                    onClick={() => setCompareOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted"
                  >
                    <Columns2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Compare
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={!typingDone || !combinedText}
                  onClick={() => void copyText()}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted disabled:opacity-40"
                >
                  <ClipboardCopy className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {copyDone ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            {detectedLang && isPro ? (
              <p className="mb-3 font-serif text-xs font-medium text-muted-foreground">
                Detected language: <span className="font-semibold text-foreground">{humanizeLanguageTag(detectedLang)}</span>
              </p>
            ) : null}

            <AnimatePresence initial={false}>
              {typingDone && combinedText ? (
                <motion.div
                  key={`extract-ok-${noteAnimKey}`}
                  role="status"
                  aria-live="polite"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  className="mb-3 flex items-center gap-2 rounded-md border border-emerald-200/90 bg-emerald-50/90 px-3 py-2 text-xs text-emerald-950 shadow-sm"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.25} aria-hidden />
                  <span className="font-semibold">Extracted successfully</span>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div className="rounded-md border-0 border-transparent bg-transparent p-0 shadow-none">
              {!typingDone ? (
                <div
                  className="min-h-[min(42vh,22rem)] w-full whitespace-pre-wrap break-words px-3 py-3 font-serif text-[15px] leading-[28px] text-foreground sm:min-h-[min(48vh,26rem)] sm:px-4 sm:text-base"
                  aria-busy="true"
                  aria-live="polite"
                >
                  {previewText}
                  <span
                    aria-hidden
                    className="inline-block h-[1.12em] w-0.5 animate-pulse bg-foreground align-text-bottom motion-reduce:animate-none"
                  />
                </div>
              ) : (
                <textarea
                  value={combinedText}
                  onChange={(e) => onVerificationChange(e.target.value)}
                  spellCheck={false}
                  placeholder={
                    isPro
                      ? "Your transcript will appear here, typed line by line on the page…"
                      : "Add a pass to run Groq AI extraction on your upload."
                  }
                  className="min-h-[min(42vh,22rem)] w-full resize-y border-0 bg-transparent px-3 py-3 font-serif text-[15px] leading-[28px] text-foreground outline-none ring-0 placeholder:text-muted-foreground sm:min-h-[min(48vh,26rem)] sm:px-4 sm:text-base"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="h-8" />

      <AnimatePresence>
        {compareOpen && selected ? (
          <motion.div
            key="ocr-compare"
            className="fixed inset-0 z-[95] flex items-center justify-center p-4 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
              aria-label="Close compare view"
              onClick={() => setCompareOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="ocr-compare-title"
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="relative flex max-h-[min(92vh,52rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
                <div>
                  <p id="ocr-compare-title" className="text-sm font-semibold text-foreground">
                    Compare — image and AI transcript
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{selected.file.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCompareOpen(false)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
              <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 md:grid-cols-2 md:divide-x md:divide-slate-100">
                <div className="flex min-h-0 flex-col bg-muted/80 p-3 sm:p-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Original</p>
                  <div className="flex min-h-[200px] flex-1 items-center justify-center overflow-auto rounded-xl border border-border bg-card p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selected.previewUrl}
                      alt=""
                      className="max-h-[min(55vh,28rem)] max-w-full object-contain"
                    />
                  </div>
                </div>
                <div className="flex min-h-0 flex-col p-3 sm:p-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">AI transcript</p>
                  <textarea
                    readOnly
                    value={combinedText}
                    spellCheck={false}
                    className="min-h-[min(55vh,28rem)] w-full flex-1 resize-y rounded-xl border border-border bg-muted/50 p-3 font-serif text-sm leading-relaxed text-foreground outline-none sm:text-[15px]"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <DailyPassUpsellModal
        open={upsellOpen}
        onClose={() => setUpsellOpen(false)}
        title="AI Handwriting OCR (Pro)"
        description={
          <>
            Groq Vision extraction with automatic language detection is included with a{" "}
            <span className="font-medium text-foreground">Daily Pass from ₹19</span>.
          </>
        }
        secondaryActionLabel="Close"
      />
    </div>
  );
}
