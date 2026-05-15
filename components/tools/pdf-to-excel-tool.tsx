"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Table2,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useId, useRef, useState } from "react";
import { downloadBlob } from "@/lib/download-blob";
import { setupPdfJsWorker } from "@/lib/setup-pdfjs-worker";
import * as PDFJS from "pdfjs-dist";
import type { PDFDocumentProxy, TextItem } from "pdfjs-dist/types/src/display/api";
import * as XLSX from "xlsx";

const MAX_BYTES = 25 * 1024 * 1024;
const ease = [0.25, 0.1, 0.25, 1] as const;

setupPdfJsWorker();

function pdfLoadErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/password|encrypted/i.test(msg)) {
    return "This PDF is password-protected. Unlock it and upload again.";
  }
  if (/invalid|corrupt|format/i.test(msg)) {
    return "This file does not look like a valid PDF. Try another export.";
  }
  return "Failed to load PDF file. Try another PDF or refresh the page.";
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

const NO_TABLE_MSG = "No table data detected on this page";

export function PdfToExcelTool() {
  const formId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [excelBlob, setExcelBlob] = useState<Blob | null>(null);
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const extractTableFromPage = useCallback(async (doc: PDFDocumentProxy, pageNum: number) => {
    try {
      setIsProcessing(true);
      setError(null);
      setExcelBlob(null);

      const page = await doc.getPage(pageNum);
      const textContent = await page.getTextContent();

      const items = textContent.items
        .filter((item): item is TextItem => "str" in item)
        .map((item) => ({
          str: item.str,
          x: item.transform[4] ?? 0,
          y: item.transform[5] ?? 0,
        }));

      const rows = new Map<number, { str: string; x: number }[]>();
      items.forEach((item) => {
        const yKey = Math.round(item.y / 10) * 10;
        const row = rows.get(yKey) ?? [];
        row.push(item);
        rows.set(yKey, row);
      });

      const sortedRows = Array.from(rows.entries())
        .sort(([y1], [y2]) => y1 - y2)
        .map(([, rowItems]) =>
          rowItems.sort((a, b) => a.x - b.x).map((item) => item.str),
        )
        .filter((row) => row.length > 0 && row.join("").trim().length > 0);

      if (sortedRows.length === 0) {
        setPreviewData([[NO_TABLE_MSG]]);
        setColumns([""]);
        return;
      }

      const maxCols = Math.max(...sortedRows.map((row) => row.length));
      const paddedRows = sortedRows.map((row) => {
        const padded = [...row];
        while (padded.length < maxCols) padded.push("");
        return padded;
      });
      const colHeaders = Array.from({ length: maxCols }, (_, i) => `Column ${i + 1}`);

      setPreviewData(paddedRows);
      setColumns(colHeaders);
    } catch {
      setError("Failed to extract data from this PDF page.");
      setPreviewData([[NO_TABLE_MSG]]);
      setColumns([""]);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const loadPdf = useCallback(
    async (file: File) => {
      setupPdfJsWorker();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFJS.getDocument({ data: arrayBuffer }).promise;
      setPdfDoc(pdf);
      setNumPages(pdf.numPages);
      setCurrentPage(1);
      await extractTableFromPage(pdf, 1);
    },
    [extractTableFromPage],
  );

  const acceptFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        setError("Please upload a PDF file.");
        return;
      }
      if (file.size > MAX_BYTES) {
        setError(`File exceeds ${formatBytes(MAX_BYTES)} limit.`);
        return;
      }

      setPdfFile(file);
      setError(null);
      setExcelBlob(null);
      setPreviewData([]);
      setColumns([]);
      setToast(null);

      try {
        await loadPdf(file);
      } catch (err) {
        console.error("PDF load failed:", err);
        setError(pdfLoadErrorMessage(err));
        setPdfDoc(null);
        setNumPages(0);
      }
    },
    [loadPdf],
  );

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

  const handlePageChange = (direction: "prev" | "next") => {
    if (!pdfDoc) return;
    let newPage = currentPage;
    if (direction === "prev" && currentPage > 1) newPage = currentPage - 1;
    else if (direction === "next" && currentPage < numPages) newPage = currentPage + 1;
    if (newPage === currentPage) return;
    setCurrentPage(newPage);
    void extractTableFromPage(pdfDoc, newPage);
  };

  const hasValidPreview =
    previewData.length > 0 &&
    !(previewData.length === 1 && previewData[0]?.[0] === NO_TABLE_MSG);

  const convertToExcel = async () => {
    if (!hasValidPreview) {
      setError("No table data to convert on this page.");
      return;
    }

    try {
      setIsConverting(true);
      setError(null);
      const ws = XLSX.utils.aoa_to_sheet(previewData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      setExcelBlob(new Blob([excelBuffer], { type: "application/octet-stream" }));
      setToast("Excel file ready — tap Download.");
      window.setTimeout(() => setToast(null), 4000);
    } catch {
      setError("Failed to create Excel file.");
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!excelBlob) return;
    const fileName = pdfFile ? pdfFile.name.replace(/\.pdf$/i, ".xlsx") : "converted.xlsx";
    downloadBlob(excelBlob, fileName);
    setToast("Download started.");
    window.setTimeout(() => setToast(null), 3000);
  };

  const handleReset = () => {
    setPdfFile(null);
    setIsProcessing(false);
    setIsConverting(false);
    setExcelBlob(null);
    setPreviewData([]);
    setColumns([]);
    setError(null);
    setCurrentPage(1);
    setNumPages(0);
    setPdfDoc(null);
    setToast(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <motion.div
      className="min-h-screen bg-white pb-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease }}
    >
      <motion.div
        className="border-b border-slate-100 bg-slate-50/50 px-4 py-4 sm:px-6"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease }}
      >
        <motion.div
          className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease }}
        >
          <Link
            href="/#tools"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-black"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All tools
          </Link>
          <span className="rounded-full border border-slate-100 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            PDF
          </span>
        </motion.div>
      </motion.div>

      <motion.div
        className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08, ease }}
      >
        <h1 className="text-2xl font-bold tracking-tight text-black sm:text-3xl">PDF to Excel</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          Pull table-like text from PDF pages and export an editable .xlsx file. Processing runs in your browser — best
          for text-based PDFs with clear rows and columns.
        </p>

        <div className="relative mt-8 space-y-6">
          <AnimatePresence>
            {(isProcessing || isConverting) && pdfFile ? (
              <motion.div
                key="busy"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-white/80 backdrop-blur-[2px]"
              >
                <motion.div
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-5 py-4 shadow-md"
                  initial={{ scale: 0.96, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                >
                  <Loader2 className="h-6 w-6 animate-spin text-black" aria-hidden />
                  <p className="text-sm font-semibold text-black">
                    {isConverting ? "Building Excel file…" : "Reading PDF page…"}
                  </p>
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <motion.div
            layout
            className="rounded-2xl border border-slate-100 bg-white p-1 shadow-sm"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, duration: 0.4, ease }}
          >
            <input
              ref={inputRef}
              id={`${formId}-pdf`}
              type="file"
              accept=".pdf,application/pdf"
              className="sr-only"
              onChange={onInput}
              aria-label="Upload PDF"
            />
            {!pdfFile ? (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`flex min-h-[200px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-12 text-center transition sm:min-h-[220px] ${
                  dragOver
                    ? "border-black bg-slate-50"
                    : "border-slate-200 bg-slate-50/40 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-100 bg-white text-black shadow-sm">
                  <Upload className="h-7 w-7" strokeWidth={1.25} aria-hidden />
                </span>
                <span className="mt-4 text-sm font-semibold text-black">Drop PDF here, or tap to browse</span>
                <span className="mt-1 text-xs text-slate-500">Text-based PDFs work best · up to {formatBytes(MAX_BYTES)}</span>
              </button>
            ) : (
              <motion.div
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
              >
                <motion.div className="min-w-0" layout>
                  <p className="truncate text-sm font-semibold text-black">{pdfFile.name}</p>
                  <p className="text-xs text-slate-500">
                    {formatBytes(pdfFile.size)}
                    {numPages > 0 ? ` · ${numPages} page${numPages !== 1 ? "s" : ""}` : ""}
                  </p>
                </motion.div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-black"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  Change file
                </button>
              </motion.div>
            )}
          </motion.div>

          {error ? (
            <motion.p
              role="alert"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {error}
            </motion.p>
          ) : null}

          {toast ? (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
            >
              {toast}
            </motion.p>
          ) : null}

          <AnimatePresence mode="wait">
            {pdfFile && numPages > 0 ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease }}
                className="space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Table2 className="h-4 w-4 text-slate-400" aria-hidden />
                    <span>
                      Page <span className="font-semibold text-black">{currentPage}</span> of{" "}
                      <span className="font-semibold text-black">{numPages}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handlePageChange("prev")}
                      disabled={currentPage <= 1 || isProcessing}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-black transition hover:bg-slate-50 disabled:opacity-40"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePageChange("next")}
                      disabled={currentPage >= numPages || isProcessing}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-black transition hover:bg-slate-50 disabled:opacity-40"
                      aria-label="Next page"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => pdfDoc && void extractTableFromPage(pdfDoc, currentPage)}
                      disabled={isProcessing}
                      className="ml-1 inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-black disabled:opacity-40"
                    >
                      <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                      Re-scan
                    </button>
                  </div>
                </div>

                {previewData.length > 0 ? (
                  <motion.div
                    layout
                    className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div className="max-h-[420px] overflow-auto" layout>
                      <table className="min-w-full divide-y divide-slate-100 text-sm">
                        <thead className="sticky top-0 bg-slate-50">
                          <tr>
                            {columns.map((col, index) => (
                              <th
                                key={index}
                                className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                              >
                                {col || "—"}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                          {previewData.map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-slate-50/80">
                              {row.map((cell, cellIndex) => (
                                <td
                                  key={cellIndex}
                                  className="max-w-[240px] break-words px-4 py-2.5 text-slate-700"
                                >
                                  {cell === "" ? (
                                    <span className="text-slate-300">—</span>
                                  ) : (
                                    cell
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </motion.div>

                    {previewData.length === 1 && previewData[0]?.[0] === NO_TABLE_MSG ? (
                      <div className="border-t border-slate-100 bg-amber-50/80 px-4 py-4 text-sm text-amber-950">
                        <p className="font-medium">No clear table on this page</p>
                        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-amber-900/90">
                          <li>Scanned PDFs — try the OCR tool first</li>
                          <li>Complex layouts may need manual cleanup in Excel</li>
                          <li>
                            After export, refine in the{" "}
                            <Link href="/tools/excel-editor" className="font-medium underline underline-offset-2">
                              Excel editor
                            </Link>
                          </li>
                        </ul>
                      </div>
                    ) : null}
                  </motion.div>
                ) : null}

                {hasValidPreview ? (
                  <motion.div
                    className="flex flex-col gap-3 sm:flex-row"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05, ease }}
                  >
                    <button
                      type="button"
                      onClick={() => void convertToExcel()}
                      disabled={isConverting || isProcessing}
                      className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isConverting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                          Converting…
                        </>
                      ) : (
                        <>
                          <FileSpreadsheet className="h-4 w-4" aria-hidden />
                          Convert to Excel
                        </>
                      )}
                    </button>
                    {excelBlob ? (
                      <button
                        type="button"
                        onClick={handleDownload}
                        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-slate-50"
                      >
                        <Download className="h-4 w-4" aria-hidden />
                        Download .xlsx
                      </button>
                    ) : null}
                  </motion.div>
                ) : null}
              </motion.div>
            ) : null}
          </AnimatePresence>

          {!pdfFile ? (
            <motion.aside
              className="grid gap-6 sm:grid-cols-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.4, ease }}
            >
              <motion.div
                className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5"
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
              >
                <h2 className="text-sm font-bold text-black">How it works</h2>
                <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-slate-600">
                  <li>Upload a PDF with tables or structured text</li>
                  <li>Preview extracted rows page by page</li>
                  <li>Convert and download .xlsx</li>
                </ol>
              </motion.div>
              <motion.div
                className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5"
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
              >
                <h2 className="text-sm font-bold text-black">Tips</h2>
                <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-slate-600">
                  <li>Text-based PDFs work better than scans</li>
                  <li>Use OCR for scanned documents</li>
                  <li>Edit output in the Excel editor if needed</li>
                </ul>
              </motion.div>
            </motion.aside>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
}
