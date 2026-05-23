"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Rows3,
  Trash2,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type Handsontable from "handsontable";
import autoTable from "jspdf-autotable";
import { jsPDF } from "jspdf";

import { ExcelEditorFormatBar } from "@/components/tools/excel-editor-format-bar";
import { ExcelEditorFindReplace } from "@/components/tools/excel-editor-find-replace";
import { ExcelEditorFormulaBar } from "@/components/tools/excel-editor-formula-bar";
import { buildExcelColumns, ExcelEditorGrid } from "@/components/tools/excel-editor-grid";
import { ExcelEditorRibbon } from "@/components/tools/excel-editor-ribbon";
import { downloadBlob } from "@/lib/download-blob";
import { CellFormatStore } from "@/lib/excel-editor/cell-format-store";
import {
  clearExcelEditorSession,
  loadExcelEditorSession,
  restoreFormatStore,
  saveExcelEditorSession,
} from "@/lib/excel-editor/session-storage";
import { mergeSheet, splitHeaderRow } from "@/lib/excel-editor/sheet-utils";
import { useHideSiteChrome } from "@/lib/hooks/use-hide-site-chrome";
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
  const router = useRouter();
  const formId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const hotInstanceRef = useRef<Handsontable.Core | null>(null);
  const formatStoreRef = useRef<CellFormatStore | null>(null);
  const restoredOnceRef = useRef(false);

  const [fileData, setFileData] = useState<(string | number)[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [sheetKey, setSheetKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  /** 1-based row used as column titles in the merged sheet, or 0 = no header row. */
  const [headerRowChoice, setHeaderRowChoice] = useState(1);
  const [findReplaceOpen, setFindReplaceOpen] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  const hasSheet = sheetKey != null && headers.length > 0;

  useHideSiteChrome(hasSheet);

  useEffect(() => {
    const session = loadExcelEditorSession();
    if (session) {
      setHeaders(session.headers);
      setFileData(session.fileData);
      setHeaderRowChoice(session.headerRowChoice);
      setOriginalFileName(session.originalFileName);
      setFileSize(session.fileSize);
      setSheetKey(session.sheetKey);
      formatStoreRef.current = restoreFormatStore(session.formats);
      restoredOnceRef.current = true;
    }
    setSessionReady(true);
  }, []);

  useEffect(() => {
    if (!sessionReady || !restoredOnceRef.current || !hasSheet) return;
    setToast("Restored your last spreadsheet from this browser.");
    const t = window.setTimeout(() => setToast(null), 3500);
    restoredOnceRef.current = false;
    return () => window.clearTimeout(t);
  }, [sessionReady, hasSheet]);

  const persistSession = useCallback(() => {
    if (!sheetKey || headers.length === 0) return;

    const hot = hotInstanceRef.current;
    const nextHeaders = hot ? (hot.getColHeader() as string[]) : headers;
    const nextData = hot ? (hot.getData() as (string | number)[][]) : fileData;

    saveExcelEditorSession({
      sheetKey,
      headers: nextHeaders,
      fileData: nextData,
      headerRowChoice,
      originalFileName,
      fileSize,
      formats: formatStoreRef.current?.exportState() ?? { cells: {}, rules: [] },
    });
  }, [
    sheetKey,
    headers,
    fileData,
    headerRowChoice,
    originalFileName,
    fileSize,
  ]);

  const schedulePersistSession = useCallback(() => {
    window.setTimeout(() => persistSession(), 400);
  }, [persistSession]);

  useEffect(() => {
    if (!hasSheet) return;
    const id = window.setTimeout(() => persistSession(), 500);
    return () => window.clearTimeout(id);
  }, [hasSheet, fileData, headers, headerRowChoice, originalFileName, persistSession]);

  useEffect(() => {
    if (!hasSheet) return;
    const onBeforeUnload = () => persistSession();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasSheet, persistSession]);

  useEffect(() => {
    if (!hasSheet) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setFindReplaceOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasSheet]);

  const handleGridReady = useCallback(
    (hot: Handsontable.Core) => {
      hotInstanceRef.current = hot;
      if (hasSheet) schedulePersistSession();
    },
    [hasSheet, schedulePersistSession],
  );

  const handleGridDestroy = useCallback(() => {
    hotInstanceRef.current = null;
  }, []);

  const applySheetToGrid = useCallback(
    (nextHeaders: string[], nextData: (string | number)[][], headerChoice: number) => {
      setHeaders(nextHeaders);
      setFileData(nextData);
      setHeaderRowChoice(headerChoice);

      const hot = hotInstanceRef.current;
      if (hot) {
        hot.updateSettings({
          colHeaders: nextHeaders,
          columns: buildExcelColumns(nextHeaders.length),
          data: nextData,
        });
        hot.render();
      }
    },
    [],
  );

  const applyHeaderRowChoice = useCallback(
    (choice: number) => {
      const hot = hotInstanceRef.current;
      if (!hot) return;

      const full = mergeSheet(hot.getColHeader() as string[], hot.getData() as (string | number)[][]);
      const headerIndex = choice === 0 ? null : choice - 1;
      const { headers: nextHeaders, data: nextData } = splitHeaderRow(full, headerIndex);
      applySheetToGrid(nextHeaders, nextData, choice);
      setToast(choice === 0 ? "Header row cleared — using Column 1, 2…" : `Row ${choice} set as header.`);
      window.setTimeout(() => setToast(null), 2500);
      schedulePersistSession();
    },
    [applySheetToGrid, schedulePersistSession],
  );

  const applyHeaderFromBodyRow = useCallback(
    (bodyRowIndex: number) => {
      applyHeaderRowChoice(bodyRowIndex + 2);
    },
    [applyHeaderRowChoice],
  );

  const handleDeleteSelectedRows = useCallback(() => {
    const hot = hotInstanceRef.current;
    if (!hot) return;

    const selected = hot.getSelected();
    if (!selected?.length) {
      setError("Select one or more rows (click the row number), then delete.");
      return;
    }

    const rowIndexes = new Set<number>();
    for (const [r1, , r2] of selected) {
      const from = Math.min(r1, r2);
      const to = Math.max(r1, r2);
      if (from < 0) continue;
      for (let r = from; r <= to; r++) rowIndexes.add(r);
    }

    if (rowIndexes.size === 0) {
      setError("Select data rows to delete (not the column header).");
      return;
    }

    setError(null);
    const sorted = [...rowIndexes].sort((a, b) => b - a);
    for (const row of sorted) {
      hot.alter("remove_row", row, 1);
    }
    const nextData = hot.getData() as (string | number)[][];
    setFileData(nextData);
    setHeaderRowChoice((prev) => {
      if (prev === 0) return 0;
      return Math.min(prev, nextData.length + 1);
    });
    setToast(sorted.length === 1 ? "1 row deleted." : `${sorted.length} rows deleted.`);
    window.setTimeout(() => setToast(null), 2500);
    schedulePersistSession();
  }, [schedulePersistSession]);

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
        setHeaderRowChoice(1);
        formatStoreRef.current = new CellFormatStore();
        const nextKey = `${file.name}-${Date.now()}`;
        setSheetKey(nextKey);
        saveExcelEditorSession({
          sheetKey: nextKey,
          headers: newHeaders,
          fileData: newData,
          headerRowChoice: 1,
          originalFileName: file.name,
          fileSize: file.size,
          formats: { cells: {}, rules: [] },
        });
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
        downloadBlob(
          new Blob([excelBuffer], { type: "application/octet-stream" }),
          `${stem}.xlsx`,
          "excel-editor",
        );
        setToast("Excel file downloaded.");
      } else {
        const csv = XLSX.utils.sheet_to_csv(XLSX.utils.aoa_to_sheet(exportData));
        downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${stem}.csv`, "excel-editor");
        setToast("CSV downloaded.");
      }
      window.setTimeout(() => setToast(null), 3000);
    } catch {
      setError("Failed to export the file.");
    }
  };

  const resetEditorState = useCallback(() => {
    hotInstanceRef.current = null;
    setSheetKey(null);
    setFileData([]);
    setHeaders([]);
    formatStoreRef.current = null;
    setHeaderRowChoice(1);
    setError(null);
    setToast(null);
    setOriginalFileName("");
    setFileSize(0);
    setFindReplaceOpen(false);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const handleReset = useCallback(() => {
    clearExcelEditorSession();
    resetEditorState();
  }, [resetEditorState]);

  const handleLeaveTool = useCallback(() => {
    clearExcelEditorSession();
    resetEditorState();
    router.push("/#tools");
  }, [resetEditorState, router]);

  const exportButtons = (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => handleExport("xlsx")}
        className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 sm:text-sm"
      >
        <FileSpreadsheet className="h-4 w-4 shrink-0" aria-hidden />
        <span className="hidden sm:inline">Excel</span>
      </button>
      <button
        type="button"
        onClick={() => handleExport("csv")}
        className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted sm:text-sm"
      >
        <Download className="h-4 w-4 shrink-0" aria-hidden />
        <span className="hidden sm:inline">CSV</span>
      </button>
      <button
        type="button"
        onClick={() => handleExport("pdf")}
        className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted sm:text-sm"
      >
        <FileText className="h-4 w-4 shrink-0" aria-hidden />
        <span className="hidden sm:inline">PDF</span>
      </button>
    </div>
  );

  if (!sessionReady) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden />
        Loading Excel editor…
      </div>
    );
  }

  if (hasSheet && sheetKey) {
    return (
      <motion.div
        className="fixed inset-0 z-40 flex h-[100dvh] w-full flex-col bg-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease }}
      >
        <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-muted px-3 py-2 sm:gap-3 sm:px-4">
          <button
            type="button"
            onClick={handleLeaveTool}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-card hover:text-foreground sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">All tools</span>
          </button>
          <div className="min-w-0 flex-1 border-l border-border pl-2 sm:pl-3">
            <p className="truncate text-sm font-semibold text-foreground">{originalFileName}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {formatBytes(fileSize)} · {fileData.length} rows × {headers.length} cols · double-click to edit
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-1.5 text-xs font-medium text-foreground">
              <Rows3 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="hidden sm:inline">Header row</span>
              <select
                value={headerRowChoice}
                onChange={(e) => applyHeaderRowChoice(Number(e.target.value))}
                className="max-w-[5.5rem] cursor-pointer rounded-md border-0 bg-transparent py-0.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Title row for column headers"
              >
                {Array.from({ length: fileData.length + 1 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    Row {n}
                  </option>
                ))}
                <option value={0}>No header</option>
              </select>
            </label>
            <button
              type="button"
              onClick={handleDeleteSelectedRows}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-2 text-xs font-semibold text-foreground transition hover:bg-muted"
              title="Select rows, then delete"
            >
              <Trash2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="hidden sm:inline">Delete rows</span>
            </button>
          </div>
          {exportButtons}
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-2 text-xs font-medium text-muted-foreground transition hover:border-border hover:text-foreground"
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

        <ExcelEditorRibbon
          hotRef={hotInstanceRef}
          sheetKey={sheetKey}
          onOpenFindReplace={() => setFindReplaceOpen(true)}
        />
        <ExcelEditorFormatBar
          hotRef={hotInstanceRef}
          formatStoreRef={formatStoreRef}
          onPersist={schedulePersistSession}
          onToast={(msg) => {
            setToast(msg);
            window.setTimeout(() => setToast(null), 2500);
          }}
        />
        <ExcelEditorFormulaBar hotRef={hotInstanceRef} sheetKey={sheetKey} />

        <div className="relative min-h-0 flex-1 w-full">
          <ExcelEditorFindReplace
            open={findReplaceOpen}
            onClose={() => setFindReplaceOpen(false)}
            hotRef={hotInstanceRef}
            onToast={(msg) => {
              setToast(msg);
              window.setTimeout(() => setToast(null), 3000);
            }}
          />
          {isLoading ? (
            <motion.div
              className="absolute inset-0 z-10 flex items-center justify-center bg-card/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 shadow-md">
                <Loader2 className="h-6 w-6 animate-spin text-foreground" aria-hidden />
                <p className="text-sm font-semibold text-foreground">Working on your file…</p>
              </div>
            </motion.div>
          ) : null}
          <ExcelEditorGrid
            sheetKey={sheetKey}
            data={fileData}
            headers={headers}
            formatStoreRef={formatStoreRef}
            onReady={handleGridReady}
            onDestroy={handleGridDestroy}
            onSetHeaderFromRow={applyHeaderFromBodyRow}
            onSheetChange={schedulePersistSession}
          />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-background pb-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease }}
    >
      <div className="border-b border-border bg-muted/50 px-4 py-4 sm:px-6">
        <motion.div
          className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease }}
        >
          <button
            type="button"
            onClick={handleLeaveTool}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All tools
          </button>
          <span className="rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Utility
          </span>
        </motion.div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Excel editor</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Open spreadsheets in your browser, edit cells with a full grid, then export to Excel, CSV, or PDF. Files stay
            on your device.
          </p>
        </motion.div>

        <div className="relative mt-8 space-y-6">
          {isLoading ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-card/80">
              <motion.div
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 shadow-md"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                <Loader2 className="h-6 w-6 animate-spin text-foreground" aria-hidden />
                <p className="text-sm font-semibold text-foreground">Working on your file…</p>
              </motion.div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-border bg-card p-1 shadow-sm">
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
                  ? "border-primary bg-muted"
                  : "border-border bg-muted/40 hover:border-border hover:bg-muted"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-sm">
                <Upload className="h-7 w-7" strokeWidth={1.25} aria-hidden />
              </span>
              <span className="mt-4 text-sm font-semibold text-foreground">Drop Excel or CSV here, or tap to browse</span>
              <span className="mt-1 text-xs text-muted-foreground">XLSX, XLS, CSV · up to {formatBytes(MAX_BYTES)}</span>
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
                className="rounded-2xl border border-border bg-muted/50 p-5"
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
              >
                <h2 className="text-sm font-bold text-foreground">How it works</h2>
                <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-muted-foreground">
                  <li>Upload an Excel or CSV file</li>
                  <li>Edit in cells or the formula bar — use =SUM(A1:A5) for formulas</li>
                  <li>Use the Format bar for fonts, colors, borders, and number formats</li>
                  <li>Copy, cut, paste, and undo/redo from the toolbar</li>
                  <li>Drag the fill handle to AutoFill patterns</li>
                  <li>Ctrl+F (Cmd+F) for find &amp; replace</li>
                  <li>Export to Excel, CSV, or PDF</li>
                </ol>
              </motion.div>
              <motion.div
                className="rounded-2xl border border-border bg-muted/50 p-5"
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
              >
                <h2 className="text-sm font-bold text-foreground">Tips</h2>
                <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-muted-foreground">
                  <li>Use arrow keys and Tab to move between cells</li>
                  <li>Right-click for row actions and paste special</li>
                  <li>Pick the header row from the toolbar dropdown</li>
                  <li>Your sheet is saved in this browser until you close or remove it</li>
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
