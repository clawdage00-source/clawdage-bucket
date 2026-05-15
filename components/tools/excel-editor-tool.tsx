"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useId, useRef, useState } from "react";
import type Handsontable from "handsontable";
import autoTable from "jspdf-autotable";
import { jsPDF } from "jspdf";

import { ExcelEditorGrid } from "@/components/tools/excel-editor-grid";
import { downloadBlob } from "@/lib/download-blob";
import * as XLSX from "xlsx";

const ACCEPT = ".xlsx,.xls,.csv";
const MAX_BYTES = 25 * 1024 * 1024;

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

const ease = [0.25, 0.1, 0.25, 1] as const;

export function ExcelEditorTool() {
  const formId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const hotInstanceRef = useRef<Handsontable.Core | null>(null);

  const [fileData, setFileData] = useState<(string | number)[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [sheetKey, setSheetKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const hasSheet = sheetKey != null && fileData.length > 0 && headers.length > 0;

  const handleGridReady = useCallback((hot: Handsontable.Core) => {
    hotInstanceRef.current = hot;
  }, []);

  const handleGridDestroy = useCallback(() => {
    hotInstanceRef.current = null;
  }, []);

  const parseFile = useCallback((file: File) => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(extension || "")) {
      setError("Please upload an Excel (.xlsx, .xls) or CSV file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`File exceeds ${formatBytes(MAX_BYTES)} limit.`);
      return;
    }

    setIsLoading(true);
    setError(null);
    setToast(null);
    setOriginalFileName(file.name);
    setFileSize(file.size);
    hotInstanceRef.current = null;
    setSheetKey(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        let workbook: XLSX.WorkBook;

        if (extension === "csv") {
          workbook = XLSX.read(data as string, { type: "string" });
        } else {
          workbook = XLSX.read(data, { type: "array" });
        }

        const wsname = workbook.SheetNames[0];
        if (!wsname) throw new Error("No worksheet found");
        const ws = workbook.Sheets[wsname];
        if (!ws) throw new Error("No worksheet found");

        const jsonData = XLSX.utils.sheet_to_json<(string | number)[]>(ws, {
          header: 1,
          defval: "",
        });

        if (jsonData.length === 0) {
          setError("The file appears to be empty.");
          setIsLoading(false);
          return;
        }

        const newHeaders = (jsonData[0] ?? []).map((c) => String(c));
        const newData = jsonData.slice(1).map((row) =>
          row.map((c) => (c === null || c === undefined ? "" : c)),
        );

        setHeaders(newHeaders);
        setFileData(newData);
        setSheetKey(`${file.name}-${Date.now()}`);
      } catch {
        setError("Failed to parse the file. Make sure it is a valid Excel or CSV file.");
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setError("Failed to read the file.");
      setIsLoading(false);
    };

    if (extension === "csv") reader.readAsText(file);
    else reader.readAsArrayBuffer(file);
  }, []);

  const acceptFile = useCallback(
    (file: File | null) => {
      if (!file) return;
      parseFile(file);
    },
    [parseFile],
  );

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) acceptFile(f);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) acceptFile(f);
  };

  const getExportPayload = (): { headers: string[]; rows: (string | number)[][] } | null => {
    const hot = hotInstanceRef.current;
    if (hot) {
      return {
        headers: hot.getColHeader() as string[],
        rows: hot.getData() as (string | number)[][],
      };
    }
    if (hasSheet) return { headers, rows: fileData };
    return null;
  };

  const handleExport = (format: "xlsx" | "csv" | "pdf") => {
    const payload = getExportPayload();
    if (!payload) {
      setError("No data to export.");
      return;
    }

    try {
      setError(null);
      const { headers: h, rows } = payload;
      const exportData = [h, ...rows];
      const stem = originalFileName.replace(/\.(xlsx|xls|csv)$/i, "") || "export";

      if (format === "pdf") {
        const doc = new jsPDF({ orientation: h.length > 6 ? "landscape" : "portrait" });
        autoTable(doc, { head: [h], body: rows.map((r) => r.map(String)) });
        doc.save(`${stem}.pdf`);
        setToast("PDF downloaded.");
      } else if (format === "xlsx") {
        const worksheet = XLSX.utils.aoa_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        downloadBlob(new Blob([excelBuffer], { type: "application/octet-stream" }), `${stem}.xlsx`);
        setToast("Excel file downloaded.");
      } else {
        const csv = XLSX.utils.sheet_to_csv(XLSX.utils.aoa_to_sheet(exportData));
        downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${stem}.csv`);
        setToast("CSV downloaded.");
      }
      window.setTimeout(() => setToast(null), 3000);
    } catch {
      setError("Failed to export the file.");
    }
  };

  const handleReset = () => {
    hotInstanceRef.current = null;
    setSheetKey(null);
    setFileData([]);
    setHeaders([]);
    setError(null);
    setToast(null);
    setOriginalFileName("");
    setFileSize(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  const exportButtons = (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => handleExport("xlsx")}
        className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 sm:text-sm"
      >
        <FileSpreadsheet className="h-4 w-4 shrink-0" aria-hidden />
        <span className="hidden sm:inline">Excel</span>
      </button>
      <button
        type="button"
        onClick={() => handleExport("csv")}
        className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-black transition hover:bg-slate-50 sm:text-sm"
      >
        <Download className="h-4 w-4 shrink-0" aria-hidden />
        <span className="hidden sm:inline">CSV</span>
      </button>
      <button
        type="button"
        onClick={() => handleExport("pdf")}
        className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-black transition hover:bg-slate-50 sm:text-sm"
      >
        <FileText className="h-4 w-4 shrink-0" aria-hidden />
        <span className="hidden sm:inline">PDF</span>
      </button>
    </div>
  );

  if (hasSheet && sheetKey) {
    return (
      <motion.div
        className="fixed inset-0 z-40 flex h-[100dvh] w-full flex-col bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease }}
      >
        <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 sm:gap-3 sm:px-4">
          <Link
            href="/#tools"
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-white hover:text-black sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">All tools</span>
          </Link>
          <div className="min-w-0 flex-1 border-l border-slate-200 pl-2 sm:pl-3">
            <p className="truncate text-sm font-semibold text-black">{originalFileName}</p>
            <p className="truncate text-[11px] text-slate-500">
              {formatBytes(fileSize)} · {fileData.length} rows × {headers.length} cols · double-click to edit
            </p>
          </div>
          {exportButtons}
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-black"
            aria-label="Remove file"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </header>

        {error ? (
          <p role="alert" className="shrink-0 border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}
        {toast ? (
          <p className="shrink-0 border-b border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-900">
            {toast}
          </p>
        ) : null}

        <div className="relative min-h-0 flex-1 w-full">
          {isLoading ? (
            <motion.div
              className="absolute inset-0 z-10 flex items-center justify-center bg-white/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-5 py-4 shadow-md">
                <Loader2 className="h-6 w-6 animate-spin text-black" aria-hidden />
                <p className="text-sm font-semibold text-black">Working on your file…</p>
              </div>
            </motion.div>
          ) : null}
          <ExcelEditorGrid
            sheetKey={sheetKey}
            data={fileData}
            headers={headers}
            onReady={handleGridReady}
            onDestroy={handleGridDestroy}
          />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-white pb-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease }}
    >
      <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-4 sm:px-6">
        <motion.div
          className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease }}
        >
          <Link
            href="/#tools"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-black"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All tools
          </Link>
          <span className="rounded-full border border-slate-100 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Utility
          </span>
        </motion.div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
          <h1 className="text-2xl font-bold tracking-tight text-black sm:text-3xl">Excel editor</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Open spreadsheets in your browser, edit cells with a full grid, then export to Excel, CSV, or PDF. Files stay
            on your device.
          </p>
        </motion.div>

        <div className="relative mt-8 space-y-6">
          {isLoading ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-white/80">
              <motion.div
                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-5 py-4 shadow-md"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                <Loader2 className="h-6 w-6 animate-spin text-black" aria-hidden />
                <p className="text-sm font-semibold text-black">Working on your file…</p>
              </motion.div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-slate-100 bg-white p-1 shadow-sm">
            <input
              ref={inputRef}
              id={`${formId}-file`}
              type="file"
              accept={ACCEPT}
              className="sr-only"
              onChange={onInput}
              aria-label="Upload Excel or CSV"
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
              disabled={isLoading}
              className={`flex min-h-[200px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-12 text-center transition sm:min-h-[220px] ${
                dragOver
                  ? "border-black bg-slate-50"
                  : "border-slate-200 bg-slate-50/40 hover:border-slate-300 hover:bg-slate-50"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-100 bg-white text-black shadow-sm">
                <Upload className="h-7 w-7" strokeWidth={1.25} aria-hidden />
              </span>
              <span className="mt-4 text-sm font-semibold text-black">Drop Excel or CSV here, or tap to browse</span>
              <span className="mt-1 text-xs text-slate-500">XLSX, XLS, CSV · up to {formatBytes(MAX_BYTES)}</span>
            </button>
          </div>

          {error ? (
            <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          ) : null}

          {toast ? (
            <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
              {toast}
            </p>
          ) : null}

          {!isLoading ? (
            <aside className="grid gap-6 sm:grid-cols-2">
              <motion.div
                className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5"
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
              >
                <h2 className="text-sm font-bold text-black">How it works</h2>
                <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-slate-600">
                  <li>Upload an Excel or CSV file</li>
                  <li>Double-click a cell to edit</li>
                  <li>Scroll to navigate large sheets</li>
                  <li>Export to Excel, CSV, or PDF</li>
                </ol>
              </motion.div>
              <motion.div
                className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5"
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
              >
                <h2 className="text-sm font-bold text-black">Tips</h2>
                <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-slate-600">
                  <li>Use arrow keys and Tab to move between cells</li>
                  <li>Right-click for row/column actions</li>
                  <li>Runs locally — nothing uploaded</li>
                </ul>
              </motion.div>
            </aside>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
