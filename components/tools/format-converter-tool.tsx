"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronDown,
  ClipboardCopy,
  Download,
  Image as RasterImageIcon,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { trackToolUse } from "@/lib/analytics";
import { decodeFileToCanvas } from "@/lib/format-converter/decode";
import {
  defaultFilenameStem,
  encodeCanvasToBlob,
  extensionForFormat,
  getOutputMime,
  type EncodeSettings,
  type OutputFormat,
} from "@/lib/format-converter/encode";

const MAX_BYTES = 50 * 1024 * 1024;
const MIN_DIM = 1;
const MAX_DIM = 32000;
const DEBOUNCE_MS = 300;

const OUTPUT_FORMATS: {
  id: OutputFormat;
  label: string;
  hint: string;
}[] = [
  { id: "png", label: "PNG", hint: "Lossless, transparency" },
  { id: "jpeg", label: "JPG", hint: "Lossy, no transparency" },
  { id: "webp", label: "WebP", hint: "Modern, optional lossless" },
  { id: "gif", label: "GIF", hint: "Indexed color, single frame" },
  { id: "avif", label: "AVIF", hint: "Best compression (Chrome encode)" },
  { id: "tiff", label: "TIFF", hint: "Uncompressed RGBA (UTIF)" },
  { id: "bmp", label: "BMP", hint: "24-bit raster" },
  { id: "svg", label: "SVG", hint: "Wraps raster in SVG" },
];

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function FormatConverterTool() {
  const formId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const genId = useRef(0);

  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [sourceKind, setSourceKind] = useState<string>("");
  const [sourceDims, setSourceDims] = useState<{ w: number; h: number } | null>(null);
  const [decodeBusy, setDecodeBusy] = useState(false);
  const [previewBusy, setPreviewBusy] = useState(false);

  const [outputFormat, setOutputFormat] = useState<OutputFormat>("webp");
  const [jpegQuality, setJpegQuality] = useState(85);
  const [webpQuality, setWebpQuality] = useState(85);
  const [webpLossless, setWebpLossless] = useState(false);
  const [preserveTransparency, setPreserveTransparency] = useState(true);
  const [gifColors, setGifColors] = useState(128);
  const [gifDelayMs, setGifDelayMs] = useState(80);
  const [gifTransparency, setGifTransparency] = useState(false);
  const [avifQuality, setAvifQuality] = useState(75);

  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputBytes, setOutputBytes] = useState<number | null>(null);
  const [filenameStem, setFilenameStem] = useState("converted");

  const [dragOver, setDragOver] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const encodeSettings: EncodeSettings = useMemo(
    () => ({
      jpegQuality,
      webpQuality,
      webpLossless,
      preserveTransparency,
      gifColors,
      gifDelayMs,
      gifTransparency,
      avifQuality,
    }),
    [
      jpegQuality,
      webpQuality,
      webpLossless,
      preserveTransparency,
      gifColors,
      gifDelayMs,
      gifTransparency,
      avifQuality,
    ],
  );

  const revokeOutput = useCallback(() => {
    setOutputUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setOutputBlob(null);
    setOutputBytes(null);
  }, []);

  const clearFile = useCallback(() => {
    setFile(null);
    setFileUrl((u) => {
      if (u) URL.revokeObjectURL(u);
      return null;
    });
    sourceCanvasRef.current = null;
    setSourceKind("");
    setSourceDims(null);
    revokeOutput();
    setError(null);
    setToast(null);
  }, [revokeOutput]);

  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
      revokeOutput();
    };
  }, [fileUrl, revokeOutput]);

  const acceptFile = useCallback(
    async (f: File | null) => {
      if (!f) return;
      setError(null);
      setToast(null);
      if (!f.type.startsWith("image/") && !/\.(heic|heif|tif|tiff)$/i.test(f.name)) {
        setError("Only image files (PNG, JPG, WebP, HEIC, TIFF, etc.) are supported.");
        return;
      }
      if (f.size > MAX_BYTES) {
        setError("File exceeds 50MB limit.");
        return;
      }
      genId.current += 1;
      setDecodeBusy(true);
      try {
        const { canvas, sourceKind: sk } = await decodeFileToCanvas(f);
        if (
          canvas.width < MIN_DIM ||
          canvas.height < MIN_DIM ||
          canvas.width > MAX_DIM ||
          canvas.height > MAX_DIM
        ) {
          throw new Error(`Image dimensions must be between ${MIN_DIM}px and ${MAX_DIM}px after decode.`);
        }
        clearFile();
        sourceCanvasRef.current = canvas;
        setSourceDims({ w: canvas.width, h: canvas.height });
        setSourceKind(sk);
        const url = URL.createObjectURL(f);
        setFile(f);
        setFileUrl(url);
        setFilenameStem(defaultFilenameStem(f.name));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not open this image.");
      } finally {
        setDecodeBusy(false);
      }
    },
    [clearFile],
  );

  useEffect(() => {
    const canvas = sourceCanvasRef.current;
    if (!canvas || !file) return;

    const myId = ++genId.current;
    setPreviewBusy(true);
    setError(null);

    let cancelled = false;

    const t = window.setTimeout(() => {
      void (async () => {
        if (cancelled) return;
        try {
          const blob = await encodeCanvasToBlob(canvas, outputFormat, encodeSettings);
          if (cancelled || genId.current !== myId) return;
          revokeOutput();
          const url = URL.createObjectURL(blob);
          setOutputBlob(blob);
          setOutputUrl(url);
          setOutputBytes(blob.size);
        } catch (e) {
          if (cancelled || genId.current !== myId) return;
          setError(e instanceof Error ? e.message : "An error occurred. Please try again.");
          revokeOutput();
        } finally {
          if (!cancelled && genId.current === myId) setPreviewBusy(false);
        }
      })();
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
      setPreviewBusy(false);
    };
  }, [file, outputFormat, encodeSettings, revokeOutput]);

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void acceptFile(f);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void acceptFile(f);
  };

  const handleDownload = () => {
    if (!outputBlob) return;
    const ext = extensionForFormat(outputFormat);
    const stem = filenameStem.trim() || "converted";
    downloadBlob(outputBlob, `${stem}.${ext}`);
    trackToolUse("format-converter", { format: outputFormat });
    setToast("Download started.");
    window.setTimeout(() => setToast(null), 3000);
  };

  const handleCopy = async () => {
    if (!outputBlob) return;
    try {
      await navigator.clipboard.write([new ClipboardItem({ [outputBlob.type]: outputBlob })]);
      setToast("Copied to clipboard.");
    } catch {
      setToast("Clipboard copy is not available in this browser.");
    }
    window.setTimeout(() => setToast(null), 3000);
  };

  const selectedMeta = OUTPUT_FORMATS.find((x) => x.id === outputFormat);
  const savingsPct =
    file && outputBytes != null && file.size > 0 ? (1 - outputBytes / file.size) * 100 : null;

  const showJpegControls = outputFormat === "jpeg" || outputFormat === "avif";
  const showWebpControls = outputFormat === "webp";
  const showGifControls = outputFormat === "gif";
  const showAlphaControls =
    outputFormat === "png" || outputFormat === "webp" || outputFormat === "gif" || outputFormat === "avif";

  const easeSnappy = [0.4, 0, 0.2, 1] as const;

  return (
    <div className="min-h-screen bg-background pb-24 font-sans antialiased text-foreground">
      <div className="bg-card/90 px-4 py-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <Link
            href="/#tools"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground/55 transition duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All tools
          </Link>
          <span className="rounded-full bg-muted px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/55 shadow-[0_1px_2px_rgb(0,0,0,0.04)]">
            Image
          </span>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-8 sm:py-14">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: easeSnappy }}
        >
          <h1 className="text-[2rem] font-bold tracking-tight text-foreground sm:text-[2.25rem] sm:leading-tight">
            Format converter
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-foreground/70">
            Switch between PNG, JPG, WebP, and more. Decoding runs in your browser; large images are scaled to a
            maximum edge of 8192px for stability.
          </p>
        </motion.div>

        <div className="relative mt-12 grid gap-10 lg:grid-cols-2 lg:gap-14">
          <section className="space-y-8">
            <div className="rounded-3xl bg-card p-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <input
                ref={inputRef}
                type="file"
                accept="image/*,.heic,.heif,.tif,.tiff"
                className="sr-only"
                aria-label="Select one image"
                onChange={onInput}
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
                disabled={decodeBusy}
                className={`flex min-h-[220px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-14 text-center transition duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform ${
                  dragOver
                    ? "scale-[1.02] border-primary/50 bg-primary/10 shadow-[0_12px_40px_-12px_rgba(37,99,235,0.25)]"
                    : "border-border/90 bg-primary/10/80 hover:border-border hover:bg-primary/10"
                } disabled:pointer-events-none disabled:opacity-55 active:scale-[0.99]`}
              >
                {decodeBusy ? (
                  <Loader2 className="h-10 w-10 animate-spin text-[#2563EB]" aria-hidden />
                ) : (
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card text-foreground/70 shadow-[0_4px_20px_rgb(0,0,0,0.06)] ring-1 ring-[#0F172A]/[0.06]">
                    <RefreshCw className="h-8 w-8" strokeWidth={1.15} aria-hidden />
                  </span>
                )}
                <span className="mt-5 text-base font-semibold text-foreground">
                  {file ? file.name : "Drag image file here, or click to select"}
                </span>
                <span className="mt-1.5 text-[13px] text-foreground/50">One file · up to {formatBytes(MAX_BYTES)}</span>
              </button>
            </div>

            {file && fileUrl ? (
              <div className="rounded-3xl bg-card p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-7">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[15px] font-semibold text-foreground">Original</h2>
                    <p className="mt-1 text-[12px] text-foreground/55">
                      {sourceKind} · {formatBytes(file.size)}
                      {sourceDims ? ` · ${sourceDims.w}×${sourceDims.h}px` : ""}
                    </p>
                    <p className="mt-1 text-[11px] text-foreground/40">Color: 8 bpc RGBA (decoded) · assumed sRGB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => clearFile()}
                    className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-xl bg-muted px-3.5 text-[13px] font-medium text-foreground/80 shadow-[0_1px_2px_rgb(0,0,0,0.04)] transition duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 active:scale-95"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                    Remove
                  </button>
                </div>
                <div className="relative mt-5 max-h-[360px] overflow-hidden rounded-2xl bg-background shadow-inner ring-1 ring-[#0F172A]/[0.04]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- blob preview */}
                  <img
                    src={fileUrl}
                    alt={`Original: ${file.name}`}
                    className="mx-auto max-h-[360px] w-full object-contain"
                  />
                </div>
              </div>
            ) : null}
          </section>

          <section className="space-y-8">
            <div className="overflow-hidden rounded-3xl bg-card shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <button
                type="button"
                onClick={() => setSettingsOpen((o) => !o)}
                className="flex w-full items-center justify-between gap-3 px-6 py-5 text-left transition duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2563EB]"
                aria-expanded={settingsOpen}
              >
                <span className="text-[15px] font-semibold text-foreground">Convert to</span>
                <ChevronDown
                  className={`h-5 w-5 text-foreground/45 transition duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${settingsOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
              <AnimatePresence initial={false}>
                {settingsOpen ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.32, ease: easeSnappy }}
                    className="border-t border-[#0F172A]/[0.06] px-6 pb-6 pt-3"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/45">
                      Output format
                    </p>
                    <div
                      className="mt-3.5 flex flex-wrap gap-2"
                      role="radiogroup"
                      aria-label="Output image format"
                    >
                      {OUTPUT_FORMATS.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          role="radio"
                          aria-checked={outputFormat === f.id}
                          onClick={() => setOutputFormat(f.id)}
                          className={`min-h-[42px] rounded-full border px-4 py-2 text-[13px] font-semibold transition duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 active:scale-95 ${
                            outputFormat === f.id
                              ? "border-[#2563EB] bg-[#2563EB] text-white shadow-[0_6px_20px_-6px_rgba(37,99,235,0.45)]"
                              : "border-[#E2E8F0] bg-background text-foreground/75 hover:border-border hover:bg-muted"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                    {selectedMeta ? (
                      <p className="mt-4 text-[13px] leading-relaxed text-foreground/65">
                        <span className="font-semibold text-foreground">{selectedMeta.label}</span> — {selectedMeta.hint}
                      </p>
                    ) : null}

                    <div className="mt-7 space-y-6 border-t border-[#0F172A]/[0.06] pt-6">
                      {showAlphaControls ? (
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[13px] font-semibold text-foreground">Preserve transparency</p>
                            <p className="mt-0.5 text-[12px] text-foreground/55">
                              Off flattens onto white for formats that allow it.
                            </p>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={preserveTransparency}
                            onClick={() => setPreserveTransparency((v) => !v)}
                            className={`relative h-9 w-14 shrink-0 rounded-full shadow-inner transition duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 ${
                              preserveTransparency ? "bg-[#2563EB]" : "bg-muted"
                            }`}
                          >
                            <span
                              className={`absolute top-1 h-7 w-7 rounded-full bg-card shadow-md ring-1 ring-[#0F172A]/5 transition duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                                preserveTransparency ? "left-6" : "left-1"
                              }`}
                            />
                            <span className="sr-only">{preserveTransparency ? "On" : "Off"}</span>
                          </button>
                        </div>
                      ) : null}

                      {showJpegControls ? (
                        <div>
                          <div className="flex justify-between text-[13px] font-semibold text-foreground">
                            <label htmlFor={`${formId}-jq`}>
                              {outputFormat === "avif" ? "AVIF quality" : "JPEG quality"}
                            </label>
                            <span className="font-medium text-[#2563EB]">
                              {outputFormat === "avif" ? avifQuality : jpegQuality}
                            </span>
                          </div>
                          <input
                            id={`${formId}-jq`}
                            type="range"
                            min={1}
                            max={100}
                            value={outputFormat === "avif" ? avifQuality : jpegQuality}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              if (outputFormat === "avif") setAvifQuality(v);
                              else setJpegQuality(v);
                            }}
                            className="format-converter-range mt-3 h-3 w-full cursor-pointer appearance-none rounded-full bg-muted"
                          />
                          <p className="mt-2 text-[11px] text-foreground/45">Low · balanced · high fidelity</p>
                        </div>
                      ) : null}

                      {showWebpControls ? (
                        <div className="space-y-5">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[13px] font-semibold text-foreground">Lossless WebP</span>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={webpLossless}
                              onClick={() => setWebpLossless((v) => !v)}
                              className={`relative h-9 w-14 shrink-0 rounded-full shadow-inner transition duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 ${
                                webpLossless ? "bg-[#2563EB]" : "bg-muted"
                              }`}
                            >
                              <span
                                className={`absolute top-1 h-7 w-7 rounded-full bg-card shadow-md ring-1 ring-[#0F172A]/5 transition duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                                  webpLossless ? "left-6" : "left-1"
                                }`}
                              />
                              <span className="sr-only">{webpLossless ? "On" : "Off"}</span>
                            </button>
                          </div>
                          {!webpLossless ? (
                            <div>
                              <div className="flex justify-between text-[13px] font-semibold text-foreground">
                                <label htmlFor={`${formId}-wq`}>WebP quality</label>
                                <span className="font-medium text-[#2563EB]">{webpQuality}</span>
                              </div>
                              <input
                                id={`${formId}-wq`}
                                type="range"
                                min={1}
                                max={100}
                                value={webpQuality}
                                onChange={(e) => setWebpQuality(Number(e.target.value))}
                                className="format-converter-range mt-3 h-3 w-full cursor-pointer appearance-none rounded-full bg-muted"
                              />
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      {showGifControls ? (
                        <div className="space-y-5">
                          <div>
                            <div className="flex justify-between text-[13px] font-semibold text-foreground">
                              <label htmlFor={`${formId}-gc`}>GIF palette colors</label>
                              <span className="font-medium text-[#2563EB]">{gifColors}</span>
                            </div>
                            <input
                              id={`${formId}-gc`}
                              type="range"
                              min={2}
                              max={256}
                              value={gifColors}
                              onChange={(e) => setGifColors(Number(e.target.value))}
                              className="format-converter-range mt-3 h-3 w-full cursor-pointer appearance-none rounded-full bg-muted"
                            />
                          </div>
                          <div>
                            <label htmlFor={`${formId}-gd`} className="text-[13px] font-semibold text-foreground">
                              Frame delay (ms)
                            </label>
                            <input
                              id={`${formId}-gd`}
                              type="number"
                              min={0}
                              step={10}
                              value={gifDelayMs}
                              onChange={(e) => setGifDelayMs(Number(e.target.value))}
                              className="mt-2.5 h-12 w-full rounded-2xl border-0 bg-muted px-4 text-sm text-foreground shadow-[inset_0_1px_2px_rgb(0,0,0,0.04)] outline-none ring-0 transition duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] focus:bg-card focus:ring-2 focus:ring-[#2563EB]/35"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[13px] font-semibold text-foreground">GIF transparency</span>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={gifTransparency}
                              onClick={() => setGifTransparency((v) => !v)}
                              className={`relative h-9 w-14 shrink-0 rounded-full shadow-inner transition duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 ${
                                gifTransparency ? "bg-[#2563EB]" : "bg-muted"
                              }`}
                            >
                              <span
                                className={`absolute top-1 h-7 w-7 rounded-full bg-card shadow-md ring-1 ring-[#0F172A]/5 transition duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                                  gifTransparency ? "left-6" : "left-1"
                                }`}
                              />
                              <span className="sr-only">{gifTransparency ? "On" : "Off"}</span>
                            </button>
                          </div>
                        </div>
                      ) : null}

                      <div>
                        <label htmlFor={`${formId}-fn`} className="text-[13px] font-semibold text-foreground">
                          Download filename (without extension)
                        </label>
                        <input
                          id={`${formId}-fn`}
                          type="text"
                          value={filenameStem}
                          onChange={(e) => setFilenameStem(e.target.value)}
                          className="mt-2.5 h-12 w-full rounded-2xl border-0 bg-muted px-4 text-sm text-foreground shadow-[inset_0_1px_2px_rgb(0,0,0,0.04)] outline-none transition duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] focus:bg-card focus:ring-2 focus:ring-[#2563EB]/35"
                          autoComplete="off"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setAdvancedOpen((o) => !o)}
                      className="mt-6 flex w-full items-center justify-between rounded-2xl bg-background px-4 py-3 text-left text-[13px] font-semibold text-foreground/80 shadow-[0_1px_2px_rgb(0,0,0,0.04)] transition duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                      aria-expanded={advancedOpen}
                    >
                      Format notes
                      <ChevronDown
                        className={`h-4 w-4 text-foreground/45 transition duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${advancedOpen ? "rotate-180" : ""}`}
                        aria-hidden
                      />
                    </button>
                    {advancedOpen ? (
                      <ul className="mt-3 space-y-2.5 text-[12px] leading-relaxed text-foreground/60">
                        <li>HEIC uses in-browser decode; export targets below (not HEIC).</li>
                        <li>TIFF export is uncompressed RGBA via UTIF (good for archival, large files).</li>
                        <li>SVG export embeds a raster PNG inside a minimal SVG wrapper.</li>
                        <li>Animated GIF/WebP/AVIF: preview uses first decoded frame only.</li>
                        <li>AVIF encoding requires a browser that supports canvas AVIF export (often Chromium).</li>
                      </ul>
                    ) : null}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {file ? (
              <div className="rounded-3xl bg-card p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-7">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[15px] font-semibold text-foreground">Output preview</h2>
                    <p className="mt-1 text-[12px] text-foreground/55">
                      {outputFormat.toUpperCase()}
                      {sourceDims ? ` · ${sourceDims.w}×${sourceDims.h}px` : ""}
                      {outputBytes != null ? ` · ${formatBytes(outputBytes)}` : ""}
                      {savingsPct != null ? (
                        <span
                          className={
                            savingsPct >= 0 ? " font-medium text-emerald-600" : " font-medium text-amber-600"
                          }
                        >
                          {" "}
                          (
                          {savingsPct >= 0
                            ? `${Math.round(savingsPct)}% smaller`
                            : `${Math.round(-savingsPct)}% larger`}{" "}
                          than original)
                        </span>
                      ) : null}
                    </p>
                  </div>
                  {previewBusy ? (
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-foreground/50">
                      <Loader2 className="h-4 w-4 animate-spin text-[#2563EB]" aria-hidden />
                      Updating…
                    </span>
                  ) : null}
                </div>
                <div className="relative mt-5 flex min-h-[200px] max-h-[360px] items-center justify-center overflow-hidden rounded-2xl bg-background shadow-inner ring-1 ring-[#0F172A]/[0.04]">
                  {outputUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- blob preview
                    <img
                      src={outputUrl}
                      alt={`Converted preview as ${outputFormat}`}
                      className="max-h-[360px] w-full object-contain"
                    />
                  ) : (
                    <p className="px-4 text-center text-[13px] text-foreground/50">
                      {previewBusy ? "Generating preview…" : "Adjust settings to update the preview."}
                    </p>
                  )}
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <button
                type="button"
                onClick={handleDownload}
                disabled={!outputBlob || previewBusy}
                className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl bg-[#2563EB] px-5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.55)] transition duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-[#1D4ED8] hover:shadow-[0_12px_36px_-6px_rgba(37,99,235,0.55),inset_0_0_0_1px_rgba(255,255,255,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
              >
                <Download className="h-4 w-4" aria-hidden />
                Download
              </button>
              <button
                type="button"
                onClick={() => void handleCopy()}
                disabled={!outputBlob || previewBusy}
                className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl border border-[#E2E8F0] bg-transparent px-5 text-sm font-semibold text-foreground/85 shadow-[0_1px_2px_rgb(0,0,0,0.04)] transition duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-border hover:bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <ClipboardCopy className="h-4 w-4" aria-hidden />
                Copy
              </button>
            </div>

            {file ? (
              <button
                type="button"
                onClick={() => {
                  clearFile();
                  inputRef.current?.click();
                }}
                className="w-full text-center text-[13px] font-semibold text-foreground/55 underline-offset-4 transition duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:text-[#2563EB] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
              >
                Upload another file
              </button>
            ) : null}

            {error ? (
              <p
                className="rounded-2xl bg-red-50/90 px-4 py-3.5 text-sm font-medium text-red-800 shadow-[0_8px_24px_-12px_rgba(220,38,38,0.2)] ring-1 ring-red-100"
                role="alert"
              >
                {error}
              </p>
            ) : null}
            {toast ? (
              <p
                className="rounded-2xl bg-emerald-50/90 px-4 py-3.5 text-sm font-medium text-emerald-900 shadow-[0_8px_24px_-12px_rgba(5,150,105,0.18)] ring-1 ring-emerald-100"
                role="status"
              >
                {toast}
              </p>
            ) : null}
          </section>
        </div>

        <section className="mx-auto mt-14 max-w-3xl rounded-3xl bg-muted/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] ring-1 ring-[#0F172A]/[0.05] sm:p-8">
          <div className="flex items-center gap-2.5 text-foreground">
            <RasterImageIcon className="h-5 w-5 text-foreground/40" strokeWidth={1.5} aria-hidden />
            <h3 className="text-sm font-semibold tracking-tight">Supported inputs</h3>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-foreground/60">
            PNG, JPEG, WebP, GIF, AVIF (where the browser can decode), BMP, SVG, TIFF, and HEIC/HEIF (via in-browser
            decode). MIME detection plus extension fallback.
          </p>
          <p className="mt-3 text-[12px] leading-relaxed text-foreground/50">
            Output MIME:{" "}
            <code className="rounded-lg bg-card/80 px-2 py-1 font-mono text-[11px] text-foreground/80 shadow-[inset_0_1px_0_rgb(255,255,255,0.8)] ring-1 ring-[#0F172A]/[0.06]">
              {getOutputMime(outputFormat)}
            </code>
          </p>
        </section>
      </main>
    </div>
  );
}
