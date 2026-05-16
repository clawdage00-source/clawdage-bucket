"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Download,
  FileText,
  GripVertical,
  Layers,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { mergeErrorMessage, mergePdfBytes, readPdfPageCount } from "@/lib/merge-pdf";

const MAX_PDFS = 30;
const MAX_FILE_BYTES = 25 * 1024 * 1024;

type PdfItem = {
  id: string;
  file: File;
  pageCount: number;
};

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
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

export function MergePdfTool() {
  const formId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<PdfItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [filename, setFilename] = useState("merged");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastPdfBlob, setLastPdfBlob] = useState<Blob | null>(null);
  const [inspecting, setInspecting] = useState(false);

  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const totalPages = items.reduce((sum, it) => sum + it.pageCount, 0);

  const validateAndBuildItems = useCallback(
    async (files: File[]): Promise<{ ok: true; next: PdfItem[] } | { ok: false; message: string }> => {
      const pdfs = files.filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
      if (pdfs.length === 0) {
        return { ok: false, message: "Only PDF files are supported." };
      }

      const oversized = pdfs.find((f) => f.size > MAX_FILE_BYTES);
      if (oversized) {
        return { ok: false, message: `Each PDF must be under ${formatBytes(MAX_FILE_BYTES)} (${oversized.name}).` };
      }

      const remaining = MAX_PDFS - itemsRef.current.length;
      if (remaining <= 0) {
        return { ok: false, message: `You can merge up to ${MAX_PDFS} PDFs at once.` };
      }

      const capped = pdfs.slice(0, remaining);
      const next: PdfItem[] = [];

      for (const file of capped) {
        try {
          const bytes = new Uint8Array(await file.arrayBuffer());
          const pageCount = await readPdfPageCount(bytes);
          if (pageCount < 1) {
            return { ok: false, message: `This PDF has no pages (${file.name}).` };
          }
          next.push({ id: makeId(), file, pageCount });
        } catch (err) {
          return { ok: false, message: mergeErrorMessage(err, file.name) };
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
      setInspecting(true);
      try {
        const result = await validateAndBuildItems(fileList);
        if (!result.ok) {
          setError(result.message);
          return;
        }
        const wanted = fileList.filter(
          (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
        ).length;
        if (result.next.length < wanted) {
          setNotice(`Added ${result.next.length} of ${wanted} files (max ${MAX_PDFS} PDFs).`);
        }
        setItems((prev) => [...prev, ...result.next]);
        setLastPdfBlob(null);
      } finally {
        setInspecting(false);
      }
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
    setItems([]);
    setError(null);
    setNotice(null);
    setSuccess(null);
    setLastPdfBlob(null);
    setProgress(0);
  };

  const removeOne = (id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
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
    setSuccess(null);
    setLastPdfBlob(null);
  };

  const mergeAndDownload = async () => {
    if (items.length < 2) {
      setError("Add at least two PDFs to merge.");
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);
    setSuccess(null);
    setProgress(0);
    setLastPdfBlob(null);

    try {
      const sources: Uint8Array[] = [];
      for (const item of items) {
        sources.push(new Uint8Array(await item.file.arrayBuffer()));
      }

      const mergedBytes = await mergePdfBytes(sources, ({ done, total }) => {
        setProgress(Math.round((done / total) * 100));
      });

      const blob = new Blob([Uint8Array.from(mergedBytes)], { type: "application/pdf" });
      setLastPdfBlob(blob);
      const safeName = filename.trim() || "merged";
      downloadBlob(blob, safeName.endsWith(".pdf") ? safeName : `${safeName}.pdf`);
      setSuccess(
        `Merged ${items.length} PDFs (${totalPages} pages) into one file. Download started — use “Download again” if you need another copy.`,
      );
    } catch (err) {
      setError(mergeErrorMessage(err));
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  const downloadAgain = () => {
    if (!lastPdfBlob) return;
    const safeName = filename.trim() || "merged";
    downloadBlob(lastPdfBlob, safeName.endsWith(".pdf") ? safeName : `${safeName}.pdf`);
  };

  const inputSurface = dragOver
    ? "border-blue-600 border-solid bg-blue-100/80 shadow-[0_8px_30px_-8px_rgba(37,99,235,0.35)]"
    : "border-[3px] border-dashed border-gray-200/90 bg-gradient-to-b from-blue-50/40 to-[#F9FAFB] shadow-[0_4px_24px_-6px_rgba(17,24,39,0.08)] hover:border-blue-300/80 hover:from-blue-50/60 hover:to-white";

  const overlayBusy = busy || inspecting;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="min-h-screen bg-white pb-24 font-sans antialiased"
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="border-b border-gray-100/80 bg-white/90 px-4 py-5 shadow-[0_1px_0_rgba(17,24,39,0.04)] backdrop-blur-sm sm:px-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3"
        >
          <Link
            href="/#tools"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#6B7280] transition duration-300 hover:text-[#111827] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
            All tools
          </Link>
          <p className="text-xs font-normal leading-relaxed text-[#6B7280]">Private — runs in your browser</p>
        </motion.div>
      </motion.div>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl sm:tracking-tight">
            Merge PDF
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base font-normal leading-relaxed text-[#6B7280] sm:text-[17px] sm:leading-[1.65]">
            Combine multiple PDFs into one file. Drag to set order, merge locally, and download — nothing is
            uploaded to our servers.
          </p>
        </div>

        <motion.div
          className="relative mt-16 space-y-10 sm:mt-20"
          aria-busy={overlayBusy}
          aria-live="polite"
          aria-atomic="true"
        >
          <AnimatePresence>
            {overlayBusy ? (
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
                  <p className="text-sm font-medium text-[#111827]">
                    {busy ? "Merging PDFs…" : "Reading PDFs…"}
                  </p>
                  {busy ? (
                    <>
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                        className="h-2.5 w-52 overflow-hidden rounded-full bg-gray-100"
                      >
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-[width] duration-300 ease-out"
                          style={{ width: `${progress}%` }}
                        />
                      </motion.div>
                      <p className="text-xs font-normal text-[#6B7280]">{progress}%</p>
                    </>
                  ) : null}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <section className="rounded-2xl bg-white p-2 shadow-[0_4px_32px_-8px_rgba(17,24,39,0.08),0_2px_12px_-4px_rgba(17,24,39,0.04)]">
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              multiple
              className="sr-only"
              aria-label="Select PDF files"
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
              disabled={overlayBusy}
              className={`flex min-h-[220px] w-full flex-col items-center justify-center rounded-2xl px-6 py-14 text-center transition duration-300 ease-out sm:min-h-[260px] ${inputSurface} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-[0_4px_20px_-4px_rgba(37,99,235,0.25)] ring-1 ring-blue-100/80">
                <UploadCloud className="h-7 w-7" strokeWidth={1.25} aria-hidden />
              </span>
              <span className="mt-6 text-lg font-semibold tracking-tight text-[#111827] sm:text-xl">
                Drag PDFs here, or click to select
              </span>
              <span className="mt-2 max-w-md text-xs font-normal leading-relaxed text-[#6B7280] sm:text-[13px]">
                Up to {MAX_PDFS} files · {formatBytes(MAX_FILE_BYTES)} each · order = page order in output
              </span>
            </button>
          </section>

          {items.length > 0 ? (
            <section className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                className="flex flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left"
              >
                <p className="text-sm font-medium text-[#111827]">
                  {items.length} PDF{items.length === 1 ? "" : "s"} · {totalPages} page
                  {totalPages === 1 ? "" : "s"} total
                </p>
                <p className="text-xs font-normal text-[#6B7280]">Drag cards to reorder before merging</p>
              </motion.div>
              <ul className="space-y-3">
                {items.map((it, index) => (
                  <li
                    key={it.id}
                    draggable={!overlayBusy}
                    onDragStart={() => setDraggingId(it.id)}
                    onDragEnd={() => setDraggingId(null)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (draggingId) reorder(draggingId, it.id);
                      setDraggingId(null);
                    }}
                    className={`flex items-center gap-3 rounded-2xl bg-white p-4 shadow-[0_6px_24px_-6px_rgba(17,24,39,0.08),0_2px_8px_-2px_rgba(17,24,39,0.04)] ring-1 ring-gray-100/80 transition duration-300 ${
                      draggingId === it.id ? "scale-[0.99] opacity-70 ring-2 ring-blue-500/50" : ""
                    }`}
                  >
                    <span
                      className="cursor-grab touch-none text-[#6B7280] transition hover:text-[#111827] active:cursor-grabbing"
                      aria-hidden
                    >
                      <GripVertical className="h-5 w-5" strokeWidth={1.5} />
                    </span>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-semibold text-blue-700">
                      {index + 1}
                    </span>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F9FAFB] text-blue-600 ring-1 ring-gray-100/90">
                      <FileText className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                    </span>
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                      className="min-w-0 flex-1"
                    >
                      <p className="truncate text-sm font-medium text-[#111827]" title={it.file.name}>
                        {it.file.name}
                      </p>
                      <p className="mt-0.5 text-xs font-normal text-[#6B7280]">
                        {formatBytes(it.file.size)} · {it.pageCount} page{it.pageCount === 1 ? "" : "s"}
                      </p>
                    </motion.div>
                    <button
                      type="button"
                      onClick={() => removeOne(it.id)}
                      disabled={overlayBusy}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#6B7280] transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-40"
                      aria-label={`Remove ${it.file.name}`}
                    >
                      <X className="h-4 w-4" strokeWidth={2} aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="rounded-2xl bg-white px-6 py-5 shadow-[0_4px_32px_-8px_rgba(17,24,39,0.08),0_2px_12px_-4px_rgba(17,24,39,0.04)] ring-1 ring-gray-100/80">
            <label htmlFor={`${formId}-fname`} className="text-sm font-medium text-[#111827]">
              Download filename
            </label>
            <input
              id={`${formId}-fname`}
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              disabled={overlayBusy}
              placeholder="merged"
              className="mt-2 h-12 w-full rounded-xl border-0 bg-[#F3F4F6] px-4 text-sm text-[#111827] outline-none transition duration-300 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-600/35 disabled:opacity-50"
              autoComplete="off"
            />
            <p className="mt-2 text-xs font-normal leading-relaxed text-[#6B7280]">
              “.pdf” is added automatically if omitted.
            </p>
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
              disabled={items.length === 0 || overlayBusy}
              className="order-2 inline-flex min-h-[44px] items-center justify-center rounded-xl px-2 text-sm font-medium text-[#6B7280] transition duration-300 hover:bg-red-50/80 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30 disabled:opacity-40 sm:order-1"
            >
              Clear all
            </button>
            <div className="order-1 flex w-full flex-col gap-3 sm:order-2 sm:max-w-lg sm:flex-1 sm:flex-row sm:justify-end">
              {lastPdfBlob ? (
                <button
                  type="button"
                  onClick={downloadAgain}
                  disabled={overlayBusy}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-medium text-[#111827] shadow-[0_4px_20px_-6px_rgba(17,24,39,0.1)] ring-1 ring-gray-100/90 transition duration-300 hover:bg-[#F9FAFB] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/35 disabled:opacity-50"
                >
                  <Download className="h-4 w-4" strokeWidth={2} aria-hidden />
                  Download again
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => void mergeAndDownload()}
                disabled={items.length < 2 || overlayBusy}
                className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-b from-blue-500 to-blue-600 px-6 text-sm font-semibold text-white shadow-[0_8px_28px_-6px_rgba(37,99,235,0.45),0_2px_8px_-2px_rgba(37,99,235,0.25)] transition duration-300 ease-out hover:scale-[1.02] hover:from-blue-500 hover:to-blue-700 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden />
                    Merging…
                  </>
                ) : (
                  <>
                    <Layers className="h-4 w-4" strokeWidth={2} aria-hidden />
                    Merge &amp; download
                  </>
                )}
              </button>
            </div>
          </footer>
        </motion.div>
      </div>
    </motion.div>
  );
}
