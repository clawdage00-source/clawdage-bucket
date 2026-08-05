"use client";

import { Hash, Loader2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import { DropZone, ToolChrome, downloadUint8, formatBytes } from "@/components/tools/shared-tool-chrome";
import { trackToolUse } from "@/lib/analytics";
import {
  addPageNumbers,
  formatPageNumber,
  pageNumberErrorMessage,
  type PageNumberColor,
  type PageNumberFormat,
  type PageNumberPosition,
} from "@/lib/pdf-page-numbers";

// react-pdf ships pdfjs 5.4.x; top-level /pdf.worker.min.mjs is 5.7.x — keep them separate.
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.react-pdf.min.mjs";

const POSITION_CLASSES: Record<PageNumberPosition, string> = {
  "top-left": "left-5 top-5",
  "top-center": "left-1/2 top-5 -translate-x-1/2",
  "top-right": "right-5 top-5",
  "bottom-left": "bottom-5 left-5",
  "bottom-center": "bottom-5 left-1/2 -translate-x-1/2",
  "bottom-right": "bottom-5 right-5",
};

export function PdfPageNumbersTool() {
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [previewPage, setPreviewPage] = useState(1);
  const [position, setPosition] = useState<PageNumberPosition>("bottom-center");
  const [format, setFormat] = useState<PageNumberFormat>("number");
  const [color, setColor] = useState<PageNumberColor>("black");
  const [fontSize, setFontSize] = useState(12);
  const [startPage, setStartPage] = useState(1);
  const [startNumber, setStartNumber] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseName = useMemo(
    () => (file ? file.name.replace(/\.pdf$/i, "") : "document"),
    [file],
  );

  const loadPdf = useCallback(async (nextFile: File) => {
    if (!/\.pdf$/i.test(nextFile.name) && nextFile.type !== "application/pdf") {
      setError("Choose a PDF file.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const data = new Uint8Array(await nextFile.arrayBuffer());
      const task = pdfjs.getDocument({ data: data.slice() });
      const document = await task.promise;
      const pages = document.numPages;
      await document.destroy();
      setFile(nextFile);
      setBytes(data);
      setNumPages(pages);
      setPreviewPage(1);
      setStartPage(1);
    } catch (loadError) {
      setFile(null);
      setBytes(null);
      setNumPages(0);
      setError(pageNumberErrorMessage(loadError));
    } finally {
      setBusy(false);
    }
  }, []);

  const previewText = useMemo(() => {
    if (!numPages || previewPage < startPage) return null;
    const number = startNumber + previewPage - startPage;
    const finalNumber = startNumber + numPages - startPage;
    return formatPageNumber(number, finalNumber, format);
  }, [format, numPages, previewPage, startNumber, startPage]);

  const exportPdf = async () => {
    if (!bytes) return;
    setBusy(true);
    setError(null);
    try {
      const output = await addPageNumbers(bytes, {
        position,
        format,
        color,
        fontSize,
        margin: 24,
        startPage,
        startNumber,
      });
      downloadUint8(output, `${baseName}-numbered.pdf`);
      trackToolUse("pdf-page-numbers", { position, format, pages: numPages });
    } catch (exportError) {
      setError(pageNumberErrorMessage(exportError));
    } finally {
      setBusy(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setBytes(null);
    setNumPages(0);
    setPreviewPage(1);
    setError(null);
  };

  return (
    <ToolChrome
      title="Add Page Numbers to PDF"
      description="Upload a PDF, choose the number style and position, then download the numbered file. Everything stays in your browser."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {!file ? (
            <DropZone
              accept="application/pdf,.pdf"
              label={busy ? "Opening PDF…" : "Drop your PDF here or click to choose"}
              hint="Your file is processed privately in this browser"
              onFiles={(files) => {
                const selectedFile = files[0];
                if (selectedFile) void loadPdf(selectedFile);
              }}
            />
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{file.name}</p>
                  <p className="text-xs text-slate-500">
                    {formatBytes(file.size)} · {numPages} page{numPages === 1 ? "" : "s"}
                  </p>
                </div>
                <button
                  type="button"
                  className="shrink-0 text-sm text-blue-600 hover:underline"
                  onClick={clearFile}
                >
                  Change file
                </button>
              </div>

              {bytes ? (
                <div className="mt-4 overflow-auto rounded-lg border border-slate-200 bg-slate-100">
                  <Document
                    file={{ data: bytes.slice() }}
                    loading={<p className="p-6 text-center text-sm text-slate-500">Loading preview…</p>}
                    error={<p className="p-4 text-sm text-red-600">Could not preview PDF.</p>}
                  >
                    <div className="relative mx-auto w-fit">
                      <Page
                        pageNumber={previewPage}
                        width={560}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                      {previewText ? (
                        <span
                          className={`pointer-events-none absolute font-sans ${POSITION_CLASSES[position]} ${
                            color === "blue"
                              ? "text-blue-700"
                              : color === "gray"
                                ? "text-slate-500"
                                : "text-slate-950"
                          }`}
                          style={{ fontSize: `${Math.max(8, fontSize)}px` }}
                        >
                          {previewText}
                        </span>
                      ) : null}
                    </div>
                  </Document>
                  <div className="flex items-center justify-between border-t border-slate-200 bg-white px-3 py-2 text-sm">
                    <button
                      type="button"
                      disabled={previewPage <= 1}
                      onClick={() => setPreviewPage((page) => Math.max(1, page - 1))}
                      className="rounded-lg px-3 py-1 hover:bg-slate-100 disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <span>
                      Page {previewPage} / {numPages}
                    </span>
                    <button
                      type="button"
                      disabled={previewPage >= numPages}
                      onClick={() => setPreviewPage((page) => Math.min(numPages, page + 1))}
                      className="rounded-lg px-3 py-1 hover:bg-slate-100 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}
        </div>

        <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900">Page number settings</p>

          <label className="block text-sm font-medium text-slate-800">
            Position
            <select
              value={position}
              onChange={(event) => setPosition(event.target.value as PageNumberPosition)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            >
              <option value="bottom-center">Bottom center</option>
              <option value="bottom-left">Bottom left</option>
              <option value="bottom-right">Bottom right</option>
              <option value="top-center">Top center</option>
              <option value="top-left">Top left</option>
              <option value="top-right">Top right</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-800">
            Number style
            <select
              value={format}
              onChange={(event) => setFormat(event.target.value as PageNumberFormat)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            >
              <option value="number">1, 2, 3</option>
              <option value="page-number">Page 1, Page 2</option>
              <option value="number-of-total">1 of {Math.max(1, numPages)}</option>
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium text-slate-800">
              Start on page
              <input
                type="number"
                min={1}
                max={Math.max(1, numPages)}
                value={startPage}
                onChange={(event) =>
                  setStartPage(Math.max(1, Math.min(numPages || 1, Number(event.target.value) || 1)))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block text-sm font-medium text-slate-800">
              First number
              <input
                type="number"
                min={0}
                value={startNumber}
                onChange={(event) => setStartNumber(Math.max(0, Number(event.target.value) || 0))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-800">
            Text colour
            <select
              value={color}
              onChange={(event) => setColor(event.target.value as PageNumberColor)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            >
              <option value="black">Black</option>
              <option value="gray">Gray</option>
              <option value="blue">Blue</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-800">
            Font size: {fontSize} pt
            <input
              type="range"
              min={8}
              max={32}
              value={fontSize}
              onChange={(event) => setFontSize(Number(event.target.value))}
              className="mt-2 w-full accent-blue-600"
            />
          </label>

          <button
            type="button"
            disabled={!bytes || busy}
            onClick={() => void exportPdf()}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Hash className="h-4 w-4" />}
            Add numbers &amp; download
          </button>
        </aside>
      </div>
    </ToolChrome>
  );
}
