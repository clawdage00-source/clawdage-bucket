"use client";

import imageCompression from "browser-image-compression";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Download,
  FileImage,
  GripVertical,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";
import { jsPDF } from "jspdf";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";

const MAX_IMAGES = 50;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MIN_DIMENSION = 100;
const MAX_DIMENSION = 10000;
const CANVAS_MAX_EDGE = 8192;

type PageSizeKey = "a4" | "letter" | "a5" | "custom";

const PAGE_SIZE_OPTIONS: { value: PageSizeKey; label: string; description: string }[] = [
  { value: "a4", label: "A4", description: "210 × 297 mm · international standard" },
  { value: "letter", label: "US Letter", description: "216 × 279 mm · North America" },
  { value: "a5", label: "A5", description: "148 × 210 mm · compact, half of A4" },
  { value: "custom", label: "Custom", description: "Define width and height in millimetres" },
];

const MARGIN_OPTIONS: { value: number; label: string; description: string }[] = [
  { value: 10, label: "10 mm", description: "Tighter layout, more image area" },
  { value: 15, label: "15 mm", description: "Balanced default for most documents" },
  { value: 20, label: "20 mm", description: "Extra breathing room around content" },
];

type PdfItem = {
  id: string;
  file: File;
  previewUrl: string;
  width: number;
  height: number;
};

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function pageSizeMm(key: PageSizeKey, customW: number, customH: number): { w: number; h: number } {
  switch (key) {
    case "a4":
      return { w: 210, h: 297 };
    case "letter":
      return { w: 215.9, h: 279.4 };
    case "a5":
      return { w: 148, h: 210 };
    case "custom": {
      const w = Number.isFinite(customW) ? Math.min(500, Math.max(50, customW)) : 210;
      const h = Number.isFinite(customH) ? Math.min(500, Math.max(50, customH)) : 297;
      return { w, h };
    }
    default:
      return { w: 210, h: 297 };
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read image."));
    img.src = src;
  });
}

function readImageDimensions(src: string): Promise<{ w: number; h: number }> {
  return loadImage(src).then((img) => ({ w: img.naturalWidth, h: img.naturalHeight }));
}

function scaleToMaxEdge(w: number, h: number, maxEdge: number): { w: number; h: number } {
  const m = Math.max(w, h);
  if (m <= maxEdge) return { w, h };
  const r = maxEdge / m;
  return { w: Math.round(w * r), h: Math.round(h * r) };
}

function fitRectMm(
  imgW: number,
  imgH: number,
  innerW: number,
  innerH: number,
): { wMm: number; hMm: number } {
  const rw = imgW / imgH;
  const rb = innerW / innerH;
  if (rw > rb) {
    return { wMm: innerW, hMm: innerW / rw };
  }
  return { wMm: innerH * rw, hMm: innerH };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function qualityToJpegFraction(q: number): number {
  const clamped = Math.min(100, Math.max(1, q));
  return 0.5 + (clamped / 100) * 0.48;
}

type SelectMenuOption = {
  value: string | number;
  label: string;
  description?: string;
};

function SelectMenu({
  id,
  labelId,
  value,
  options,
  onChange,
  disabled,
  open,
  onOpenChange,
}: {
  id: string;
  labelId: string;
  value: string | number;
  options: SelectMenuOption[];
  onChange: (next: string | number) => void;
  disabled?: boolean;
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = rootRef.current;
      if (el && !el.contains(e.target as Node)) onOpenChange(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange]);

  return (
    <div ref={rootRef} className="relative" data-dropdown-root>
      <button
        type="button"
        id={id}
        aria-labelledby={labelId}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => {
          if (!disabled) onOpenChange(!open);
        }}
        className={`flex h-12 w-full items-center justify-between gap-3 rounded-xl bg-[#F3F4F6] px-4 text-left outline-none transition duration-300 hover:bg-gray-200/70 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-600/35 disabled:cursor-not-allowed disabled:opacity-50 ${
          open ? "bg-white ring-2 ring-blue-600/25 shadow-[0_2px_12px_-4px_rgba(37,99,235,0.12)]" : ""
        }`}
      >
        <span className="min-w-0 flex-1">
          {selected ? (
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-[#111827]">{selected.label}</span>
              {selected.description ? (
                <span className="line-clamp-2 text-xs font-normal leading-snug text-[#6B7280]">
                  {selected.description}
                </span>
              ) : null}
            </span>
          ) : (
            <span className="text-sm text-[#6B7280]">Choose…</span>
          )}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-[#6B7280] transition duration-300 ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
          aria-hidden
        />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.ul
            key="list"
            role="listbox"
            aria-labelledby={labelId}
            id={`${id}-listbox`}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 max-h-72 overflow-y-auto overscroll-contain rounded-xl border border-gray-100/95 bg-white py-1.5 shadow-[0_20px_50px_-12px_rgba(17,24,39,0.2),0_8px_24px_-8px_rgba(17,24,39,0.1)] ring-1 ring-black/[0.03]"
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <li
                  key={String(opt.value)}
                  role="option"
                  tabIndex={isSelected ? 0 : -1}
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    onOpenChange(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onChange(opt.value);
                      onOpenChange(false);
                    }
                  }}
                  className={`mx-1 flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 text-left transition duration-200 outline-none hover:bg-blue-50/90 focus-visible:bg-blue-50/90 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600/25 ${
                    isSelected ? "bg-blue-50/70" : ""
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition duration-200 ${
                      isSelected
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-gray-200 bg-white text-transparent"
                    }`}
                    aria-hidden
                  >
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-[#111827]">{opt.label}</span>
                    {opt.description ? (
                      <span className="mt-0.5 block text-xs font-normal leading-snug text-[#6B7280]">
                        {opt.description}
                      </span>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

async function rasterizeForPdf(
  item: PdfItem,
  opts: { compress: boolean; jpegQuality: number },
): Promise<string> {
  let sourceUrl = item.previewUrl;
  let revokeExtra: string | null = null;

  try {
    let file = item.file;
    if (opts.compress) {
      file = await imageCompression(item.file, {
        maxWidthOrHeight: CANVAS_MAX_EDGE,
        useWebWorker: true,
        initialQuality: 0.82,
      });
      revokeExtra = URL.createObjectURL(file);
      sourceUrl = revokeExtra;
    }

    const img = await loadImage(sourceUrl);
    const { w, h } = scaleToMaxEdge(img.naturalWidth, img.naturalHeight, CANVAS_MAX_EDGE);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available in this browser.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", qualityToJpegFraction(opts.jpegQuality));
  } finally {
    if (revokeExtra) URL.revokeObjectURL(revokeExtra);
  }
}

export function ImageToPdfTool() {
  const formId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<PdfItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pageSize, setPageSize] = useState<PageSizeKey>("a4");
  const [customW, setCustomW] = useState(210);
  const [customH, setCustomH] = useState(297);
  const [pdfQuality, setPdfQuality] = useState(72);
  const [autoCompress, setAutoCompress] = useState(false);
  const [marginMm, setMarginMm] = useState(10);
  const [filename, setFilename] = useState("document");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastPdfBlob, setLastPdfBlob] = useState<Blob | null>(null);
  const [openSelect, setOpenSelect] = useState<null | "page" | "margin">(null);

  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    return () => {
      itemsRef.current.forEach((it) => URL.revokeObjectURL(it.previewUrl));
    };
  }, []);

  const revokeAll = useCallback((list: PdfItem[]) => {
    list.forEach((it) => URL.revokeObjectURL(it.previewUrl));
  }, []);

  const validateAndBuildItems = useCallback(
    async (files: File[]): Promise<{ ok: true; next: PdfItem[] } | { ok: false; message: string }> => {
      const images = files.filter((f) => /image\/(jpeg|png)$/i.test(f.type));
      if (images.length === 0) {
        return { ok: false, message: "Only JPG and PNG files are supported." };
      }

      const oversized = images.find((f) => f.size > MAX_FILE_BYTES);
      if (oversized) {
        return { ok: false, message: "One or more files exceed the 10MB limit." };
      }

      const remaining = MAX_IMAGES - itemsRef.current.length;
      if (remaining <= 0) {
        return { ok: false, message: `You can add up to ${MAX_IMAGES} images.` };
      }

      const capped = images.slice(0, remaining);
      const next: PdfItem[] = [];

      for (const file of capped) {
        const previewUrl = URL.createObjectURL(file);
        try {
          const { w, h } = await readImageDimensions(previewUrl);
          if (w < MIN_DIMENSION || h < MIN_DIMENSION) {
            URL.revokeObjectURL(previewUrl);
            return {
              ok: false,
              message: `Each image must be at least ${MIN_DIMENSION}×${MIN_DIMENSION} pixels (${file.name}).`,
            };
          }
          if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
            URL.revokeObjectURL(previewUrl);
            return {
              ok: false,
              message: `Each side must be at most ${MAX_DIMENSION}px (${file.name}).`,
            };
          }
          next.push({ id: makeId(), file, previewUrl, width: w, height: h });
        } catch {
          URL.revokeObjectURL(previewUrl);
          return { ok: false, message: "Could not read one of the images. Try another file." };
        }
      }

      return { ok: true, next };
    },
    [],
  );

  const acceptFiles = useCallback(
    async (fileList: File[]) => {
      setError(null);
      setNotice(null);
      setSuccess(null);
      const result = await validateAndBuildItems(fileList);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      const wanted = fileList.filter((f) => /image\/(jpeg|png)$/i.test(f.type)).length;
      if (result.next.length < wanted) {
        setNotice(`Added ${result.next.length} of ${wanted} files (max ${MAX_IMAGES} images in one batch).`);
      }
      setItems((prev) => [...prev, ...result.next]);
    },
    [validateAndBuildItems],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (list?.length) void acceptFiles([...list]);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) void acceptFiles([...e.dataTransfer.files]);
  };

  const clearAll = () => {
    setItems((prev) => {
      revokeAll(prev);
      return [];
    });
    setError(null);
    setNotice(null);
    setSuccess(null);
    setLastPdfBlob(null);
    setProgress(0);
  };

  const removeOne = (id: string) => {
    setItems((prev) => {
      const t = prev.find((x) => x.id === id);
      if (t) URL.revokeObjectURL(t.previewUrl);
      return prev.filter((x) => x.id !== id);
    });
    setSuccess(null);
    setLastPdfBlob(null);
  };

  const reorder = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    setItems((prev) => {
      const from = prev.findIndex((x) => x.id === fromId);
      const to = prev.findIndex((x) => x.id === toId);
      if (from < 0 || to < 0) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(from, 1);
      if (!moved) return prev;
      copy.splice(to, 0, moved);
      return copy;
    });
  };

  const convertAndDownload = async () => {
    if (items.length === 0) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    setSuccess(null);
    setProgress(0);
    setLastPdfBlob(null);

    const { w: pw, h: ph } = pageSizeMm(pageSize, customW, customH);
    const margin = Math.min(25, Math.max(5, marginMm));
    const innerW = pw - 2 * margin;
    const innerH = ph - 2 * margin;

    try {
      let pdf: jsPDF | null = null;

      for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        if (!item) break;

        const dataUrl = await rasterizeForPdf(item, {
          compress: autoCompress,
          jpegQuality: pdfQuality,
        });

        if (!pdf) {
          pdf = new jsPDF({ unit: "mm", format: [pw, ph], orientation: "portrait" });
        } else {
          pdf.addPage([pw, ph], "portrait");
        }

        const { wMm, hMm } = fitRectMm(item.width, item.height, innerW, innerH);
        const x = margin + (innerW - wMm) / 2;
        const y = margin + (innerH - hMm) / 2;
        pdf.addImage(dataUrl, "JPEG", x, y, wMm, hMm, undefined, "MEDIUM");

        const pct = Math.round(((i + 1) / items.length) * 100);
        setProgress(pct);
        await new Promise<void>((r) => {
          requestAnimationFrame(() => r());
        });
      }

      if (!pdf) throw new Error("No PDF was generated.");

      const blob = pdf.output("blob");
      setLastPdfBlob(blob);
      const safeName = filename.trim() || "document";
      downloadBlob(blob, safeName.endsWith(".pdf") ? safeName : `${safeName}.pdf`);
      setSuccess("PDF created — your download should start automatically.");
      window.setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An error occurred during conversion. Please try again.",
      );
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  const downloadAgain = () => {
    if (!lastPdfBlob) return;
    const safeName = filename.trim() || "document";
    downloadBlob(lastPdfBlob, safeName.endsWith(".pdf") ? safeName : `${safeName}.pdf`);
  };

  const qualityLabel =
    pdfQuality < 40 ? "Lower file size" : pdfQuality < 70 ? "Balanced" : "Higher fidelity";

  const inputSurface = dragOver
    ? "border-blue-600 border-solid bg-blue-100/80 shadow-[0_8px_30px_-8px_rgba(37,99,235,0.35)]"
    : "border-[3px] border-dashed border-gray-200/90 bg-gradient-to-b from-blue-50/40 to-[#F9FAFB] shadow-[0_4px_24px_-6px_rgba(17,24,39,0.08)] hover:border-blue-300/80 hover:from-blue-50/60 hover:to-white";

  return (
    <div className="min-h-screen bg-white pb-24 font-sans antialiased">
      <div className="border-b border-gray-100/80 bg-white/90 px-4 py-5 shadow-[0_1px_0_rgba(17,24,39,0.04)] backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
          <Link
            href="/#tools"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#6B7280] transition duration-300 hover:text-[#111827] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
            All tools
          </Link>
          <p className="text-xs font-normal leading-relaxed text-[#6B7280]">Private — runs in your browser</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl sm:tracking-tight">
            Image to PDF
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base font-normal leading-relaxed text-[#6B7280] sm:text-[17px] sm:leading-[1.65]">
            Turn JPG or PNG pages into a single PDF. Drag to reorder, tune page size and quality, then
            convert — no uploads to a server.
          </p>
        </motion.div>

        <div
          className="relative mt-16 space-y-10 sm:mt-20"
          aria-busy={busy}
          aria-live="polite"
          aria-atomic="true"
        >
          <AnimatePresence>
            {busy ? (
              <motion.div
                key="busy"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center rounded-2xl bg-white/75 pt-28 backdrop-blur-[2px]"
              >
                <div className="flex flex-col items-center gap-4 rounded-2xl bg-white px-8 py-7 shadow-[0_12px_40px_-12px_rgba(17,24,39,0.12),0_4px_16px_-4px_rgba(17,24,39,0.06)]">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" strokeWidth={2} aria-hidden />
                  <p className="text-sm font-medium text-[#111827]">Building PDF…</p>
                  <div className="h-2.5 w-52 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-[width] duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs font-normal text-[#6B7280]">{progress}%</p>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <section className="rounded-2xl bg-white p-2 shadow-[0_4px_32px_-8px_rgba(17,24,39,0.08),0_2px_12px_-4px_rgba(17,24,39,0.04)]">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png"
              multiple
              className="sr-only"
              aria-label="Select JPG or PNG images"
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
              disabled={busy}
              className={`flex min-h-[220px] w-full flex-col items-center justify-center rounded-2xl px-6 py-14 text-center transition duration-300 ease-out sm:min-h-[260px] ${inputSurface} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-[0_4px_20px_-4px_rgba(37,99,235,0.25)] ring-1 ring-blue-100/80">
                <UploadCloud className="h-7 w-7" strokeWidth={1.25} aria-hidden />
              </span>
              <span className="mt-6 text-lg font-semibold tracking-tight text-[#111827] sm:text-xl">
                Drag JPG or PNG files here, or click to select
              </span>
              <span className="mt-2 max-w-md text-xs font-normal leading-relaxed text-[#6B7280] sm:text-[13px]">
                Up to {MAX_IMAGES} images · {formatBytes(MAX_FILE_BYTES)} each · order = PDF pages
              </span>
            </button>
          </section>

          {items.length > 0 ? (
            <section className="space-y-4">
              <div className="flex flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
                <p className="text-sm font-medium text-[#111827]">
                  {items.length} image{items.length === 1 ? "" : "s"} selected
                </p>
                <p className="text-xs font-normal text-[#6B7280]">Drag cards to reorder pages</p>
              </div>
              <ul className="flex gap-4 overflow-x-auto pb-3 pt-1 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5">
                {items.map((it) => (
                  <li
                    key={it.id}
                    draggable
                    onDragStart={() => setDraggingId(it.id)}
                    onDragEnd={() => setDraggingId(null)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (draggingId) reorder(draggingId, it.id);
                      setDraggingId(null);
                    }}
                    className={`group relative w-[136px] shrink-0 rounded-2xl bg-white p-2.5 shadow-[0_6px_24px_-6px_rgba(17,24,39,0.08),0_2px_8px_-2px_rgba(17,24,39,0.04)] ring-1 ring-gray-100/80 transition duration-300 hover:shadow-[0_10px_32px_-8px_rgba(17,24,39,0.1)] ${
                      draggingId === it.id ? "scale-[0.98] opacity-70 ring-2 ring-blue-500/50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-1 border-b border-gray-100/90 pb-2.5">
                      <span
                        className="cursor-grab touch-none text-[#6B7280] transition duration-300 group-hover:text-[#111827] active:cursor-grabbing"
                        aria-hidden
                      >
                        <GripVertical className="h-5 w-5" strokeWidth={1.5} />
                      </span>
                      <span className="sr-only">Drag to reorder {it.file.name}</span>
                    </div>
                    <div className="relative mt-2.5 aspect-square overflow-hidden rounded-xl bg-[#F9FAFB]">
                      {/* eslint-disable-next-line @next/next/no-img-element -- blob preview */}
                      <img
                        src={it.previewUrl}
                        alt={it.file.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                      <button
                        type="button"
                        onClick={() => removeOne(it.id)}
                        disabled={busy}
                        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-xl bg-white/95 text-[#6B7280] opacity-0 shadow-[0_4px_12px_-2px_rgba(17,24,39,0.12)] ring-1 ring-gray-200/60 transition duration-300 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-40"
                        aria-label={`Remove ${it.file.name}`}
                      >
                        <X className="h-4 w-4" strokeWidth={2} aria-hidden />
                      </button>
                    </div>
                    <p className="mt-2.5 truncate text-xs font-medium text-[#111827]" title={it.file.name}>
                      {it.file.name}
                    </p>
                    <p className="text-[11px] font-normal leading-relaxed text-[#6B7280]">{formatBytes(it.file.size)}</p>
                    <p className="text-[11px] font-normal text-[#6B7280]">
                      {it.width}×{it.height}px
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="overflow-hidden rounded-2xl bg-white shadow-[0_4px_32px_-8px_rgba(17,24,39,0.08),0_2px_12px_-4px_rgba(17,24,39,0.04)] ring-1 ring-gray-100/80">
            <button
              type="button"
              onClick={() => {
                setSettingsOpen((o) => {
                  if (o) setOpenSelect(null);
                  return !o;
                });
              }}
              className="flex w-full items-center justify-between gap-3 px-6 py-5 text-left transition duration-300 hover:bg-[#F9FAFB]/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600/30"
              aria-expanded={settingsOpen}
              id={`${formId}-settings-toggle`}
            >
              <span className="text-[15px] font-medium tracking-tight text-[#111827]">Settings</span>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-[#6B7280] transition duration-300 ${settingsOpen ? "rotate-180" : ""}`}
                strokeWidth={1.75}
                aria-hidden
              />
            </button>
            <AnimatePresence initial={false}>
              {settingsOpen ? (
                <motion.div
                  key="panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                  className="border-t border-gray-100/80"
                >
                  <div className="grid gap-8 p-6 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-7">
                    <div className="space-y-2">
                      <p id={`${formId}-page-lbl`} className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                        PDF page size
                      </p>
                      <SelectMenu
                        id={`${formId}-page`}
                        labelId={`${formId}-page-lbl`}
                        value={pageSize}
                        options={PAGE_SIZE_OPTIONS}
                        onChange={(v) => setPageSize(v as PageSizeKey)}
                        disabled={busy}
                        open={openSelect === "page"}
                        onOpenChange={(next) => setOpenSelect(next ? "page" : null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <p id={`${formId}-margin-lbl`} className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                        Page margins
                      </p>
                      <SelectMenu
                        id={`${formId}-margin`}
                        labelId={`${formId}-margin-lbl`}
                        value={marginMm}
                        options={MARGIN_OPTIONS}
                        onChange={(v) => setMarginMm(Number(v))}
                        disabled={busy}
                        open={openSelect === "margin"}
                        onOpenChange={(next) => setOpenSelect(next ? "margin" : null)}
                      />
                    </div>
                    {pageSize === "custom" ? (
                      <div className="grid grid-cols-1 gap-4 sm:col-span-2 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label htmlFor={`${formId}-cw`} className="text-xs font-medium text-[#6B7280]">
                            Width (mm)
                          </label>
                          <input
                            id={`${formId}-cw`}
                            type="number"
                            min={50}
                            max={500}
                            value={customW}
                            onChange={(e) => setCustomW(Number(e.target.value))}
                            disabled={busy}
                            className="h-12 w-full rounded-xl border-0 bg-[#F3F4F6] px-4 text-sm text-[#111827] outline-none transition duration-300 focus:bg-white focus:ring-2 focus:ring-blue-600/35 disabled:opacity-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor={`${formId}-ch`} className="text-xs font-medium text-[#6B7280]">
                            Height (mm)
                          </label>
                          <input
                            id={`${formId}-ch`}
                            type="number"
                            min={50}
                            max={500}
                            value={customH}
                            onChange={(e) => setCustomH(Number(e.target.value))}
                            disabled={busy}
                            className="h-12 w-full rounded-xl border-0 bg-[#F3F4F6] px-4 text-sm text-[#111827] outline-none transition duration-300 focus:bg-white focus:ring-2 focus:ring-blue-600/35 disabled:opacity-50"
                          />
                        </div>
                      </div>
                    ) : null}
                    <div className="sm:col-span-2">
                      <div className="flex items-baseline justify-between gap-2">
                        <label htmlFor={`${formId}-quality`} className="text-sm font-medium text-[#111827]">
                          PDF image quality
                        </label>
                        <span className="text-xs font-normal text-[#6B7280]">{qualityLabel}</span>
                      </div>
                      <input
                        id={`${formId}-quality`}
                        type="range"
                        min={1}
                        max={100}
                        value={pdfQuality}
                        onChange={(e) => setPdfQuality(Number(e.target.value))}
                        disabled={busy}
                        className="quality-slider mt-4 h-3 w-full cursor-pointer appearance-none rounded-full bg-gray-200/90 disabled:opacity-50"
                      />
                      <div className="mt-2 flex justify-between text-[11px] font-normal text-[#6B7280]">
                        <span>Low</span>
                        <span>Medium</span>
                        <span>High</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:col-span-2">
                      <div>
                        <p className="text-sm font-medium text-[#111827]">Auto-compress before PDF</p>
                        <p className="mt-0.5 text-xs font-normal leading-relaxed text-[#6B7280]">
                          Shrinks heavy photos while keeping layout.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={autoCompress}
                        onClick={() => setAutoCompress((v) => !v)}
                        disabled={busy}
                        className={`relative h-9 w-14 shrink-0 rounded-full shadow-inner transition duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-50 ${
                          autoCompress ? "bg-blue-600" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`absolute top-1 h-7 w-7 rounded-full bg-white shadow-md ring-1 ring-black/5 transition duration-300 ease-out ${
                            autoCompress ? "left-6" : "left-1"
                          }`}
                        />
                        <span className="sr-only">{autoCompress ? "On" : "Off"}</span>
                      </button>
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor={`${formId}-fname`} className="text-sm font-medium text-[#111827]">
                        Download filename
                      </label>
                      <input
                        id={`${formId}-fname`}
                        type="text"
                        value={filename}
                        onChange={(e) => setFilename(e.target.value)}
                        disabled={busy}
                        placeholder="document"
                        className="mt-2 h-12 w-full rounded-xl border-0 bg-[#F3F4F6] px-4 text-sm text-[#111827] outline-none transition duration-300 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-600/35 disabled:opacity-50"
                        autoComplete="off"
                      />
                      <p className="mt-2 text-xs font-normal leading-relaxed text-[#6B7280]">
                        “.pdf” is added automatically if omitted.
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </section>

          {notice ? (
            <p
              className="rounded-2xl bg-[#F9FAFB] px-5 py-4 text-sm font-normal leading-relaxed text-[#374151] shadow-[0_2px_12px_-4px_rgba(17,24,39,0.06)] ring-1 ring-gray-100/90"
              role="status"
            >
              {notice}
            </p>
          ) : null}
          {error ? (
            <p
              className="rounded-2xl border border-red-100/90 bg-red-50/90 px-5 py-4 text-sm font-normal leading-relaxed text-red-800 shadow-[0_2px_12px_-4px_rgba(220,38,38,0.08)]"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          {success ? (
            <p
              className="rounded-2xl border border-blue-100/90 bg-blue-50/80 px-5 py-4 text-sm font-normal leading-relaxed text-[#111827] shadow-[0_2px_12px_-4px_rgba(37,99,235,0.12)]"
              role="status"
            >
              {success}
            </p>
          ) : null}

          <footer className="flex flex-col gap-6 border-t border-gray-100/90 pt-12 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
            <button
              type="button"
              onClick={clearAll}
              disabled={items.length === 0 || busy}
              className="order-2 inline-flex min-h-[44px] items-center justify-center rounded-xl px-2 text-sm font-medium text-[#6B7280] transition duration-300 hover:bg-red-50/80 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30 disabled:opacity-40 sm:order-1"
            >
              Clear all
            </button>
            <div className="order-1 flex w-full flex-col gap-3 sm:order-2 sm:max-w-lg sm:flex-1 sm:flex-row sm:justify-end">
              {lastPdfBlob ? (
                <button
                  type="button"
                  onClick={downloadAgain}
                  disabled={busy}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-medium text-[#111827] shadow-[0_4px_20px_-6px_rgba(17,24,39,0.1)] ring-1 ring-gray-100/90 transition duration-300 hover:bg-[#F9FAFB] hover:shadow-[0_6px_24px_-6px_rgba(17,24,39,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/35 disabled:opacity-50"
                >
                  <FileImage className="h-4 w-4" strokeWidth={2} aria-hidden />
                  Download again
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => void convertAndDownload()}
                disabled={items.length === 0 || busy}
                className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-b from-blue-500 to-blue-600 px-6 text-sm font-semibold text-white shadow-[0_8px_28px_-6px_rgba(37,99,235,0.45),0_2px_8px_-2px_rgba(37,99,235,0.25)] transition duration-300 ease-out hover:scale-[1.02] hover:from-blue-500 hover:to-blue-700 hover:shadow-[0_12px_36px_-8px_rgba(37,99,235,0.5)] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden />
                    Converting…
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" strokeWidth={2} aria-hidden />
                    Convert &amp; download
                  </>
                )}
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
