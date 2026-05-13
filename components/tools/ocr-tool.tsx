"use client";

import { Document, Packer, Paragraph, TextRun } from "docx";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCopy,
  Download,
  FileDown,
  FileText,
  ImagePlus,
  Loader2,
  Lock,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { jsPDF } from "jspdf";
import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { DailyPassUpsellModal } from "@/components/tools/daily-pass-upsell-modal";
import { OCR_LANGUAGE_OPTIONS } from "@/lib/ocr-languages";
import { preprocessBlobToFile, preprocessImageToPngBlob } from "@/lib/ocr-preprocess";
import { collectWordTokensFromBlocks, type OcrWordToken } from "@/lib/ocr-tesseract-words";
import { loadHandwritingPipeline, runHandwritingOcr } from "@/lib/ocr-trocr";

const MAX_BULK = 10;
/** Browsers send many `image/*` MIME types; we exclude vector SVG (needs different pipeline). */
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
  /** Word-level confidence (standard Tesseract + blocks only). */
  words?: OcrWordToken[];
};

type ProgressState = { message: string; percent: number };

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Partial OCR preview: completed lines joined with `\n`, then current line sliced to `charIdx`. */
function buildTypewriterPartial(lines: string[], lineIdx: number, charIdx: number): string {
  let s = "";
  for (let i = 0; i < lineIdx; i += 1) {
    s += lines[i] ?? "";
    s += "\n";
  }
  s += (lines[lineIdx] ?? "").slice(0, charIdx);
  return s;
}

function humanizeStatus(status: string): string {
  const map: Record<string, string> = {
    "loading tesseract core": "Initializing OCR engine…",
    "loading language traineddata": "Loading language data…",
    "initializing api": "Preparing worker…",
    "initializing tesseract": "Starting Tesseract…",
    "recognizing text": "Recognizing text…",
    "loading script": "Loading script…",
    "ended": "Finishing…",
  };
  return map[status] ?? status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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

async function fileToJpegDataUrl(file: File, maxDim: number): Promise<string> {
  const bitmap = await createImageBitmap(file);
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

async function buildDocxBlob(text: string): Promise<Blob> {
  const lines = text.split(/\r?\n/);
  const children = lines.map((line) => new Paragraph({ children: [new TextRun(line.length ? line : " ")] }));
  const doc = new Document({
    sections: [{ children }],
  });
  return Packer.toBlob(doc);
}

async function buildSearchablePdf(items: OcrItem[]): Promise<void> {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 40;
  let first = true;

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i]!;
    const dataUrl = await fileToJpegDataUrl(item.file, 1400);
    const props = pdf.getImageProperties(dataUrl);
    const maxW = pageW - margin * 2;
    const maxH = pageH - margin * 2;
    const ratio = Math.min(maxW / props.width, maxH / props.height);
    const iw = props.width * ratio;
    const ih = props.height * ratio;
    const x = (pageW - iw) / 2;
    const y = margin + (maxH - ih) / 2;

    if (!first) pdf.addPage();
    first = false;
    pdf.addImage(dataUrl, "JPEG", x, y, iw, ih);

    pdf.addPage();
    pdf.setFontSize(10);
    const header = items.length > 1 ? `— ${item.file.name} —\n\n` : "";
    const body = header + (item.text.trim() || "(No text detected)");
    const lines = pdf.splitTextToSize(body, pageW - margin * 2);
    pdf.text(lines, margin, margin + 14);
  }

  pdf.save(items.length > 1 ? "ocr-bulk-export.pdf" : "ocr-export.pdf");
}

export type OcrToolProps = {
  isPro: boolean;
};

type TessRecognizeData = {
  text: string;
  confidence: number;
  blocks?: unknown;
};

type TessWorker = {
  recognize: (
    image: File | Blob,
    opts?: object,
    output?: { blocks?: boolean; text?: boolean },
  ) => Promise<{ data: TessRecognizeData }>;
  reinitialize: (langs: string) => Promise<unknown>;
  terminate: () => Promise<unknown>;
};

export function OcrTool({ isPro }: OcrToolProps) {
  const formId = useId();
  const workerRef = useRef<TessWorker | null>(null);
  const workerLangRef = useRef<string | null>(null);
  const itemsRef = useRef<OcrItem[]>([]);

  const [lang, setLang] = useState("eng");
  const [items, setItems] = useState<OcrItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [combinedText, setCombinedText] = useState("");
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [copyDone, setCopyDone] = useState(false);
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  /** Bumps after a successful OCR run so the note block can replay its “ink settling” motion. */
  const [noteAnimKey, setNoteAnimKey] = useState(0);
  /** Shown in the note; animates toward `combinedText` line-by-line with a typing cadence. */
  const [previewText, setPreviewText] = useState("");
  const [typingDone, setTypingDone] = useState(true);
  const typingTimerRef = useRef<number | null>(null);
  const lastJoinedOcrRef = useRef("");

  /** Standard = Tesseract (printed). Handwriting = TrOCR (Pro, large local model). */
  const [ocrMode, setOcrMode] = useState<"standard" | "handwriting">("standard");
  const [preBrightness, setPreBrightness] = useState(0);
  const [preContrastPct, setPreContrastPct] = useState(100);
  /** Pro: Otsu binarization before OCR. */
  const [autoBinarize, setAutoBinarize] = useState(false);
  /** TrOCR weights download (only after selecting handwriting + Pro). */
  const [modelLoadProgress, setModelLoadProgress] = useState<ProgressState | null>(null);
  const [showConfidenceReview, setShowConfidenceReview] = useState(false);

  const verifyImageScrollRef = useRef<HTMLDivElement | null>(null);
  const verifyTextScrollRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollSyncLock = useRef<"none" | "text" | "image">("none");

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    if (!isPro && ocrMode === "handwriting") {
      const id = window.setTimeout(() => setOcrMode("standard"), 0);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [isPro, ocrMode]);

  useEffect(() => {
    if (!isPro || ocrMode !== "handwriting") {
      const clearId = window.setTimeout(() => setModelLoadProgress(null), 0);
      return () => window.clearTimeout(clearId);
    }
    let cancelled = false;
    const bootId = window.setTimeout(() => {
      setModelLoadProgress({ message: "Downloading AI model…", percent: 1 });
      void loadHandwritingPipeline((p) => {
        if (!cancelled) {
          setModelLoadProgress({
            message: p.message,
            percent: Math.max(0, Math.min(100, p.percent)),
          });
        }
      })
        .then(() => {
          if (!cancelled) setModelLoadProgress(null);
        })
        .catch((e: unknown) => {
          if (!cancelled) {
            setModelLoadProgress(null);
            const msg = e instanceof Error ? e.message : String(e);
            window.setTimeout(() => setError(`Could not load handwriting model: ${msg}`), 0);
          }
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(bootId);
    };
  }, [isPro, ocrMode]);

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
      /** Long transcripts type faster (more chars per tick) so the page stays usable. */
      const charsPerTick = totalChars > 3500 ? Math.max(2, Math.ceil(totalChars / 2800)) : 1;
      const charDelayMs = Math.max(6, Math.min(26, Math.floor(7200 / Math.max(1, totalChars))));
      const pauseBetweenLinesMs = 72;

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

  const terminateWorkerSafe = useCallback(async () => {
    if (workerRef.current) {
      try {
        await workerRef.current.terminate();
      } catch {
        /* ignore */
      }
      workerRef.current = null;
      workerLangRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      void terminateWorkerSafe();
    };
  }, [terminateWorkerSafe]);

  const ensureWorker = useCallback(async (code: string, onLog: (m: ProgressState) => void) => {
    const tess = await import("tesseract.js");
    const createWorker = tess.createWorker as (langs: string, oem?: number, opts?: { logger?: (m: { status: string; progress: number }) => void }) => Promise<TessWorker>;
    const OEM_LSTM = tess.OEM?.LSTM_ONLY ?? 1;

    const logger = (m: { status: string; progress: number }) => {
      const pct = typeof m.progress === "number" ? Math.min(100, Math.max(0, Math.round(m.progress * 100))) : 0;
      onLog({ message: humanizeStatus(m.status), percent: pct });
    };

    if (!workerRef.current) {
      onLog({ message: "Initializing OCR engine…", percent: 0 });
      workerRef.current = await createWorker(code, OEM_LSTM, { logger });
      workerLangRef.current = code;
      return workerRef.current;
    }

    if (workerLangRef.current !== code) {
      onLog({ message: `Switching language…`, percent: 0 });
      await workerRef.current.reinitialize(code);
      workerLangRef.current = code;
    }
    return workerRef.current;
  }, []);

  const revokeItems = useCallback((list: OcrItem[]) => {
    list.forEach((i) => URL.revokeObjectURL(i.previewUrl));
  }, []);

  const clearAll = useCallback(() => {
    void terminateWorkerSafe();
    setItems((prev) => {
      revokeItems(prev);
      return [];
    });
    setSelectedIndex(0);
    setCombinedText("");
    lastJoinedOcrRef.current = "";
    setPreviewText("");
    setTypingDone(true);
    setShowConfidenceReview(false);
    setProgress(null);
    setError(null);
    setHint(null);
  }, [revokeItems, terminateWorkerSafe]);

  const addFiles = useCallback(
    (fileList: File[]) => {
      const allowed = fileList.filter(isRasterImageFile);
      if (allowed.length === 0) {
        setError("Use a raster image (e.g. JPG, PNG, WebP, GIF, TIFF, BMP). SVG is not supported.");
        return;
      }
      const cap = isPro ? MAX_BULK : 1;
      let next = allowed;
      if (!isPro && allowed.length > 1) {
        setUpsellOpen(true);
        next = allowed.slice(0, 1);
      }
      if (isPro && allowed.length > MAX_BULK) {
        setHint(`Only the first ${MAX_BULK} images were added.`);
        next = allowed.slice(0, MAX_BULK);
      } else {
        setHint(null);
      }

      setError(null);
      setItems((prev) => {
        revokeItems(prev);
        const mapped: OcrItem[] = next.map((file) => ({
          id: makeId(),
          file,
          previewUrl: URL.createObjectURL(file),
          text: "",
        }));
        return mapped.slice(0, cap);
      });
      setSelectedIndex(0);
      setCombinedText("");
      lastJoinedOcrRef.current = "";
      setPreviewText("");
      setTypingDone(true);
      setShowConfidenceReview(false);
      setProgress(null);
    },
    [isPro, revokeItems],
  );

  const runOcr = async () => {
    if (items.length === 0) return;
    if (ocrMode === "handwriting" && !isPro) {
      setUpsellOpen(true);
      return;
    }
    setBusy(true);
    setError(null);
    setHint(null);
    setCopyDone(false);
    setShowConfidenceReview(false);

    const parts: string[] = [];
    const preOpts = {
      grayscale: true,
      brightness: preBrightness,
      contrast: preContrastPct / 100,
      binarize: isPro && autoBinarize,
    };

    try {
      for (let i = 0; i < items.length; i += 1) {
        const item = items[i]!;
        setProgress({
          message: items.length > 1 ? `Image ${i + 1} of ${items.length}: preparing…` : "Preparing image…",
          percent: Math.round((i / Math.max(1, items.length)) * 12),
        });

        const ocrBlob = await preprocessImageToPngBlob(item.file, preOpts);
        const ocrFile = preprocessBlobToFile(ocrBlob, item.file.name);

        if (ocrMode === "handwriting") {
          const text = await runHandwritingOcr(ocrBlob, (tp) => {
            if (items.length > 1) {
              const base = ((i + (tp.percent / 100) * 0.92) / items.length) * 100;
              setProgress({
                message: `Handwriting AI: ${item.file.name} — ${tp.message}`,
                percent: Math.round(base),
              });
            } else {
              setProgress({ message: tp.message, percent: tp.percent });
            }
          });
          parts.push(items.length > 1 ? `--- ${item.file.name} ---\n\n${text}` : text);

          setItems((prev) =>
            prev.map((row) => (row.id === item.id ? { ...row, text, words: undefined } : row)),
          );
        } else {
          const worker = await ensureWorker(lang, (p) => {
            if (items.length > 1) {
              const base = ((i + (p.percent / 100) * 0.9) / items.length) * 100;
              setProgress({
                message: `Recognizing: ${item.file.name} — ${p.message}`,
                percent: Math.round(base),
              });
            } else {
              setProgress(p);
            }
          });

          const { data } = await worker.recognize(ocrFile, {}, { blocks: true });
          const text = data.text ?? "";
          const words = collectWordTokensFromBlocks((data as { blocks?: unknown }).blocks ?? data);

          parts.push(items.length > 1 ? `--- ${item.file.name} ---\n\n${text}` : text);

          const conf = typeof data.confidence === "number" ? data.confidence : null;
          if (conf != null && conf < 45 && text.trim().length > 0) {
            setHint(
              "Low confidence on this scan. Try preprocessing sliders, a sharper photo, or Handwriting AI (Pro).",
            );
          } else if (conf != null && conf < 45 && text.trim().length === 0) {
            setHint("Very little text was found. Try a clearer, higher-resolution image.");
          }

          setItems((prev) =>
            prev.map((row) => (row.id === item.id ? { ...row, text, words } : row)),
          );
        }
      }

      const joined = parts.join("\n\n");
      lastJoinedOcrRef.current = joined;
      setNoteAnimKey((k) => k + 1);
      setProgress({ message: "Done", percent: 100 });
      window.setTimeout(() => setProgress(null), 1200);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(
        msg.includes("network") || msg.includes("fetch") || msg.includes("ENOTFOUND")
          ? "Could not download model or language data. Check your connection and try again."
          : `OCR failed: ${msg}. Try another image, language, or engine.`,
      );
      void terminateWorkerSafe();
    } finally {
      setBusy(false);
    }
  };

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

  const openUpsell = () => setUpsellOpen(true);

  const exportDocx = async () => {
    if (!isPro) {
      openUpsell();
      return;
    }
    if (!combinedText.trim()) {
      setError("Run OCR first to extract text.");
      return;
    }
    try {
      const blob = await buildDocxBlob(combinedText);
      downloadBlob(blob, "ocr-export.docx");
    } catch {
      setError("Could not build Word document.");
    }
  };

  const exportPdf = async () => {
    if (!isPro) {
      openUpsell();
      return;
    }
    const list = itemsRef.current;
    if (list.length === 0) {
      setError("Add at least one image.");
      return;
    }
    if (!list.some((r) => r.text.trim()) && !combinedText.trim()) {
      setError("Run OCR first to extract text.");
      return;
    }
    try {
      setBusy(true);
      await buildSearchablePdf(
        list.map((r) => ({
          ...r,
          text: r.text.trim() || "(No text detected)",
        })),
      );
    } catch {
      setError("Could not build PDF.");
    } finally {
      setBusy(false);
    }
  };

  const selected = items[selectedIndex] ?? items[0];

  const selectedWords = useMemo(() => selected?.words ?? [], [selected]);

  const syncTextScrollToImage = useCallback(() => {
    const ta = verifyTextScrollRef.current;
    const wrap = verifyImageScrollRef.current;
    if (!ta || !wrap) return;
    if (scrollSyncLock.current === "image") return;
    scrollSyncLock.current = "text";
    const taMax = Math.max(1, ta.scrollHeight - ta.clientHeight);
    const wrapMax = Math.max(1, wrap.scrollHeight - wrap.clientHeight);
    const ratio = taMax <= 1 ? 0 : ta.scrollTop / taMax;
    wrap.scrollTop = ratio * wrapMax;
    requestAnimationFrame(() => {
      scrollSyncLock.current = "none";
    });
  }, []);

  const syncImageScrollToText = useCallback(() => {
    const ta = verifyTextScrollRef.current;
    const wrap = verifyImageScrollRef.current;
    if (!ta || !wrap) return;
    if (scrollSyncLock.current === "text") return;
    scrollSyncLock.current = "image";
    const taMax = Math.max(1, ta.scrollHeight - ta.clientHeight);
    const wrapMax = Math.max(1, wrap.scrollHeight - wrap.clientHeight);
    const ratio = wrapMax <= 1 ? 0 : wrap.scrollTop / wrapMax;
    ta.scrollTop = ratio * taMax;
    requestAnimationFrame(() => {
      scrollSyncLock.current = "none";
    });
  }, []);

  const onVerificationChange = (v: string) => {
    setCombinedText(v);
    setItems((prev) => {
      if (prev.length !== 1) return prev;
      return prev.map((row, j) => (j === selectedIndex ? { ...row, text: v } : row));
    });
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-white pb-20">
      <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-[90rem] flex-wrap items-center justify-between gap-3">
          <Link
            href="/#tools"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-black"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All tools
          </Link>
          <p className="text-xs text-slate-500">
            {isPro
              ? "Pro: handwriting AI, binarize, bulk (10), Word & searchable PDF"
              : "Free: Tesseract OCR, cleanup sliders · Pass unlocks AI + binarize + exports"}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6 sm:py-10">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <h1 className="text-2xl font-bold tracking-tight text-black sm:text-3xl">Image to text (OCR)</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Printed documents use fast Tesseract.js (many languages). Pro adds local TrOCR handwriting recognition,
            Otsu binarization for messy scans, and exports — everything runs in your browser.
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
                dragOver ? "border-black bg-slate-50" : "border-slate-200 bg-slate-50/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <ImagePlus className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-black">Drop images here</p>
                  <p className="mt-1 text-xs text-slate-600">
                    JPG, PNG, WebP, GIF, TIFF, BMP, and other raster images · {isPro ? `up to ${MAX_BULK} files` : "1 file on free plan"}
                  </p>
                  <input
                    id={`${formId}-file`}
                    type="file"
                    accept={ACCEPT}
                    multiple={isPro}
                    className="sr-only"
                    onChange={(e) => {
                      const fl = e.target.files;
                      e.target.value = "";
                      if (fl?.length) addFiles(Array.from(fl));
                    }}
                  />
                  <label
                    htmlFor={`${formId}-file`}
                    className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
                  >
                    Browse files
                  </label>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <label htmlFor={`${formId}-lang`} className="text-sm font-medium text-black">
                Document language
              </label>
              <select
                id={`${formId}-lang`}
                value={lang}
                disabled={busy || ocrMode === "handwriting"}
                onChange={(e) => setLang(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3 text-sm text-black outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-50"
              >
                {OCR_LANGUAGE_OPTIONS.map((o) => (
                  <option key={o.code} value={o.code}>
                    {o.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-500">
                {ocrMode === "handwriting"
                  ? "Handwriting AI is English-centric; language packs are not used."
                  : "First run downloads language data (one-time per language)."}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-black">OCR mode</p>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setOcrMode("standard")}
                  className={`rounded-xl border px-3 py-3 text-left text-sm transition ${
                    ocrMode === "standard"
                      ? "border-black bg-slate-50 font-semibold text-black"
                      : "border-slate-200 font-medium text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="block">Printed / scan</span>
                  <span className="mt-0.5 block text-xs font-normal text-slate-500">Tesseract — fast, multi-language</span>
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (!isPro) {
                      setUpsellOpen(true);
                      return;
                    }
                    setOcrMode("handwriting");
                  }}
                  className={`rounded-xl border px-3 py-3 text-left text-sm transition ${
                    ocrMode === "handwriting"
                      ? "border-black bg-slate-50 font-semibold text-black"
                      : "border-slate-200 font-medium text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 shrink-0 text-violet-600" aria-hidden />
                    Handwriting AI
                    {!isPro ? <Lock className="h-3.5 w-3.5 shrink-0 text-amber-700" aria-hidden /> : null}
                  </span>
                  <span className="mt-0.5 block text-xs font-normal text-slate-500">
                    TrOCR in-browser (Pro) · larger one-time model download
                  </span>
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-slate-600" aria-hidden />
                <p className="text-sm font-medium text-black">Image cleanup</p>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Grayscale pipeline plus manual brightness/contrast before OCR. Improves faint ink and uneven lighting.
              </p>
              <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor={`${formId}-bright`}>
                Brightness
              </label>
              <input
                id={`${formId}-bright`}
                type="range"
                min={-45}
                max={45}
                step={1}
                value={preBrightness}
                disabled={busy}
                onChange={(e) => setPreBrightness(Number(e.target.value))}
                className="mt-1 w-full accent-black"
              />
              <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor={`${formId}-contrast`}>
                Contrast
              </label>
              <input
                id={`${formId}-contrast`}
                type="range"
                min={75}
                max={135}
                step={1}
                value={preContrastPct}
                disabled={busy}
                onChange={(e) => setPreContrastPct(Number(e.target.value))}
                className="mt-1 w-full accent-black"
              />
              {isPro ? (
                <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm text-black">
                  <input
                    type="checkbox"
                    className="mt-1 rounded border-slate-300"
                    checked={autoBinarize}
                    disabled={busy}
                    onChange={(e) => setAutoBinarize(e.target.checked)}
                  />
                  <span>
                    <span className="font-semibold">Auto-cleanup (Otsu binarize)</span>
                    <span className="mt-0.5 block text-xs font-normal text-slate-500">
                      Strong noise and shadow removal for messy backgrounds.
                    </span>
                  </span>
                </label>
              ) : (
                <p className="mt-3 text-xs text-slate-500">
                  <span className="font-medium text-black">Daily Pass</span> unlocks Otsu binarization for noisy scans.
                </p>
              )}
            </div>

            {isPro && ocrMode === "handwriting" && modelLoadProgress && !busy ? (
              <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-4 shadow-sm">
                <p className="text-xs font-semibold text-violet-950">Downloading AI model…</p>
                <p className="mt-1 text-xs text-violet-800/90">{modelLoadProgress.message}</p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-violet-100">
                  <div
                    className="h-full rounded-full bg-violet-600 transition-[width] duration-300"
                    style={{ width: `${modelLoadProgress.percent}%` }}
                  />
                </div>
                <p className="mt-1 text-right text-[11px] tabular-nums text-violet-700">{modelLoadProgress.percent}%</p>
              </div>
            ) : null}

            {items.length > 1 ? (
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Images</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {items.map((it, idx) => (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => setSelectedIndex(idx)}
                      className={`relative h-16 w-16 overflow-hidden rounded-lg border-2 ${
                        idx === selectedIndex ? "border-black" : "border-slate-200"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={it.previewUrl} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy || items.length === 0}
                onClick={() => void runOcr()}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-40"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <FileText className="h-4 w-4" aria-hidden />}
                Run OCR
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={clearAll}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-black transition hover:bg-slate-50 disabled:opacity-40"
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
                  className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                >
                  <p className="text-xs font-medium text-slate-600">{progress.message}</p>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      className="h-full rounded-full bg-black"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress.percent}%` }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  </div>
                  <p className="mt-1 text-right text-[11px] tabular-nums text-slate-500">{progress.percent}%</p>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {error ? (
              <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-900">
                <X className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{error}</span>
              </div>
            ) : null}
            {hint ? <p className="text-xs text-amber-800">{hint}</p> : null}
          </motion.div>

          <motion.div layout className="flex min-h-0 flex-col gap-4 lg:min-h-0">
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Verification</p>
              <p className="text-xs text-slate-500">
                Scroll the image and text together (proportional sync). Edit the transcript before export.
              </p>
              <div className="mt-4 grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
                <div className="min-h-0">
                  <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-wide text-slate-400 lg:text-left">
                    Original
                  </p>
                  <div
                    ref={verifyImageScrollRef}
                    onScroll={syncImageScrollToText}
                    className="max-h-[min(52vh,26rem)] overflow-auto rounded-xl border border-slate-100 bg-slate-50/80 p-2"
                  >
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
                        <motion.div
                          aria-hidden
                          className="pointer-events-none absolute left-0 right-0 z-20 mix-blend-soft-light"
                          style={{
                            height: "20%",
                            background:
                              "linear-gradient(180deg, transparent 0%, rgba(34,211,238,0.35) 42%, rgba(34,211,238,0.65) 50%, rgba(34,211,238,0.35) 58%, transparent 100%)",
                          }}
                          initial={{ top: "-20%" }}
                          animate={{ top: ["-20%", "100%"] }}
                          transition={{
                            duration: busy ? 1.45 : 2.65,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                      </motion.div>
                    ) : (
                      <div className="flex min-h-[220px] items-center justify-center text-sm text-slate-500">No image yet</div>
                    )}
                  </div>
                </div>

                <div className="flex min-h-0 flex-col">
                  <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-wide text-slate-400 lg:text-left">
                    Extracted text
                  </p>
                  <motion.div
                    initial={{ opacity: 0.92, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="flex min-h-0 flex-1 flex-col rounded-xl border border-slate-200 bg-[linear-gradient(180deg,#fffdfc_0%,#faf8f5_100%)] p-3 sm:p-4"
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-600">Transcript</span>
                      <button
                        type="button"
                        disabled={!combinedText && !previewText}
                        onClick={() => void copyText()}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-black shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
                      >
                        <ClipboardCopy className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        {copyDone ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <AnimatePresence initial={false}>
                      {typingDone && combinedText ? (
                        <motion.div
                          key={`extract-ok-${noteAnimKey}`}
                          role="status"
                          aria-live="polite"
                          initial={{ opacity: 0, y: -6, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, transition: { duration: 0.15 } }}
                          transition={{ type: "spring", stiffness: 420, damping: 26 }}
                          className="mb-2 flex items-center gap-2 rounded-lg border border-emerald-200/90 bg-emerald-50/95 px-2.5 py-2 text-xs shadow-sm"
                        >
                          <motion.div
                            className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100"
                            initial={{ scale: 0, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 520, damping: 22 }}
                          >
                            <CheckCircle2 className="relative z-[1] h-4 w-4 text-emerald-600" strokeWidth={2.25} aria-hidden />
                            <motion.span
                              aria-hidden
                              className="pointer-events-none absolute inset-0 rounded-full border-2 border-emerald-500/45"
                              initial={{ scale: 0.55, opacity: 0.85 }}
                              animate={{ scale: 1.75, opacity: 0 }}
                              transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
                            />
                          </motion.div>
                          <span className="font-semibold text-emerald-950">Extracted successfully</span>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                    <textarea
                      ref={verifyTextScrollRef}
                      onScroll={syncTextScrollToImage}
                      readOnly={!typingDone}
                      value={typingDone ? combinedText : previewText}
                      onChange={(e) => onVerificationChange(e.target.value)}
                      spellCheck={false}
                      placeholder="Run OCR — text appears here with a short typing preview, then you can edit."
                      className="min-h-[min(40vh,18rem)] w-full flex-1 resize-y rounded-lg border border-slate-200 bg-white/90 p-3 font-serif text-sm leading-relaxed text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-300 sm:text-[15px]"
                      aria-busy={!typingDone}
                    />
                    {selectedWords.length > 0 ? (
                      <div className="mt-2 border-t border-slate-200/80 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowConfidenceReview((v) => !v)}
                          className="text-xs font-semibold text-slate-700 underline decoration-slate-300 decoration-1 underline-offset-2 hover:text-black"
                        >
                          {showConfidenceReview ? "Hide" : "Show"} confidence review (Tesseract words)
                        </button>
                        {showConfidenceReview ? (
                          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-md border border-slate-100 bg-slate-50 p-2 font-serif text-xs leading-relaxed text-slate-800">
                            {selectedWords.map((w, idx) => (
                              <span
                                key={`${idx}-${w.text}`}
                                className={
                                  w.confidence < 70
                                    ? "text-red-700 underline decoration-red-500 decoration-wavy underline-offset-2"
                                    : ""
                                }
                              >
                                {w.text}{" "}
                              </span>
                            ))}
                          </pre>
                        ) : null}
                        <p className="mt-1 text-[10px] text-slate-500">
                          Under 70% confidence: wavy red (printed mode). Handwriting AI does not emit per-word scores.
                        </p>
                      </div>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-200/80 pt-3">
                      <button
                        type="button"
                        onClick={() => void exportDocx()}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-black shadow-sm transition hover:bg-slate-50"
                      >
                        {isPro ? <Download className="h-3.5 w-3.5" aria-hidden /> : <Lock className="h-3.5 w-3.5 text-amber-700" aria-hidden />}
                        Export Word (.docx)
                        {!isPro ? (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-900">
                            Pro
                          </span>
                        ) : null}
                      </button>
                      <button
                        type="button"
                        onClick={() => void exportPdf()}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-black shadow-sm transition hover:bg-slate-50"
                      >
                        {isPro ? <FileDown className="h-3.5 w-3.5" aria-hidden /> : <Lock className="h-3.5 w-3.5 text-amber-700" aria-hidden />}
                        Export PDF (searchable)
                        {!isPro ? (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-900">
                            Pro
                          </span>
                        ) : null}
                      </button>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <DailyPassUpsellModal
        open={upsellOpen}
        onClose={() => setUpsellOpen(false)}
        title="Pro OCR features"
        description={
          <>
            <span className="font-medium text-black">Handwriting AI (TrOCR)</span>,{" "}
            <span className="font-medium text-black">Otsu auto-cleanup</span>,{" "}
            <span className="font-medium text-black">Word (.docx)</span>,{" "}
            <span className="font-medium text-black">searchable PDF</span>, and{" "}
            <span className="font-medium text-black">up to {MAX_BULK} images</span> per batch are included with a{" "}
            <span className="font-medium text-black">Daily Pass from ₹19</span>.
          </>
        }
        secondaryActionLabel="Continue with free"
      />
    </div>
  );
}
