"use client";

import { Document, Page, pdfjs } from "react-pdf";
import { Loader2, Scissors } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { DropZone, ToolChrome, downloadUint8, formatBytes } from "@/components/tools/shared-tool-chrome";
import { trackToolUse } from "@/lib/analytics";
import {
  extractPages,
  parsePageSelection,
  splitByRanges,
  splitErrorMessage,
  splitEveryPage,
} from "@/lib/pdf-split";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

type SplitMode = "range" | "extract" | "every";

export function PdfSplitTool() {
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [mode, setMode] = useState<SplitMode>("range");
  const [rangeInput, setRangeInput] = useState("1-1");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [previewPage, setPreviewPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseName = useMemo(
    () => (file ? file.name.replace(/\.pdf$/i, "") : "document"),
    [file],
  );

  const loadPdf = useCallback(async (f: File) => {
    setError(null);
    setFile(f);
    const buf = new Uint8Array(await f.arrayBuffer());
    setBytes(buf);
    const task = pdfjs.getDocument({ data: buf.slice() });
    const doc = await task.promise;
    setNumPages(doc.numPages);
    setRangeInput(`1-${doc.numPages}`);
    setSelected(new Set([1]));
    setPreviewPage(1);
    await doc.destroy();
  }, []);

  const togglePage = (p: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  };

  const runSplit = async () => {
    if (!bytes) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === "every") {
        const parts = await splitEveryPage(bytes, baseName);
        for (const part of parts) {
          downloadUint8(part.bytes, part.filename);
          await new Promise((r) => setTimeout(r, 300));
        }
        trackToolUse("pdf-split", { mode: "every", count: parts.length });
      } else if (mode === "extract") {
        const pages = [...selected].sort((a, b) => a - b);
        if (pages.length === 0) throw new Error("Select at least one page.");
        const out = await extractPages(bytes, pages);
        downloadUint8(out, `${baseName}-extract.pdf`);
        trackToolUse("pdf-split", { mode: "extract", count: pages.length });
      } else {
        const parts = await splitByRanges(bytes, rangeInput, baseName);
        for (const part of parts) {
          downloadUint8(part.bytes, part.filename);
          await new Promise((r) => setTimeout(r, 300));
        }
        trackToolUse("pdf-split", { mode: "range", count: parts.length });
      }
    } catch (err) {
      setError(splitErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const parsedPreview = useMemo(() => {
    if (!numPages) return [];
    return parsePageSelection(rangeInput, numPages);
  }, [rangeInput, numPages]);

  return (
    <ToolChrome
      title="PDF Split — Extract & Separate Pages"
      description="Split PDFs by page range, extract selected pages, or save every page as its own file. Preview pages before export — 100% in your browser."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {!file ? (
            <DropZone
              accept="application/pdf,.pdf"
              label="Drop a PDF to split"
              hint="Preview and split locally"
              onFiles={(files) => {
                const f = files[0];
                if (f) void loadPdf(f);
              }}
            />
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{file.name}</p>
                  <p className="text-xs text-slate-500">
                    {formatBytes(file.size)} · {numPages} page{numPages === 1 ? "" : "s"}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:underline"
                  onClick={() => {
                    setFile(null);
                    setBytes(null);
                    setNumPages(0);
                  }}
                >
                  Change file
                </button>
              </div>

              {bytes ? (
                <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                  <Document
                    file={{ data: bytes.slice() }}
                    loading={<p className="p-6 text-center text-sm text-slate-500">Loading preview…</p>}
                    onLoadSuccess={({ numPages: n }) => setNumPages(n)}
                    error={<p className="p-4 text-sm text-red-600">Could not preview PDF.</p>}
                  >
                    <Page
                      pageNumber={previewPage}
                      width={560}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </Document>
                  <div className="flex items-center justify-between border-t border-slate-200 bg-white px-3 py-2 text-sm">
                    <button
                      type="button"
                      disabled={previewPage <= 1}
                      onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                      className="rounded-lg px-3 py-1 hover:bg-slate-100 disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <span>
                      Page {previewPage} / {numPages || "—"}
                    </span>
                    <button
                      type="button"
                      disabled={previewPage >= numPages}
                      onClick={() => setPreviewPage((p) => Math.min(numPages, p + 1))}
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
          <p className="text-sm font-semibold text-slate-900">Split mode</p>
          <div className="space-y-2">
            {(
              [
                ["range", "Split by ranges", "e.g. 1-3,5,7-9 → separate PDFs"],
                ["extract", "Extract pages", "Pick pages → one combined PDF"],
                ["every", "Every page", "Each page → its own PDF"],
              ] as const
            ).map(([id, label, hint]) => (
              <label
                key={id}
                className={`flex cursor-pointer gap-3 rounded-xl border px-3 py-2.5 text-sm ${
                  mode === id ? "border-blue-500 bg-blue-50" : "border-slate-200"
                }`}
              >
                <input
                  type="radio"
                  name="split-mode"
                  checked={mode === id}
                  onChange={() => setMode(id)}
                  className="mt-1"
                />
                <span>
                  <span className="font-medium text-slate-900">{label}</span>
                  <span className="block text-xs text-slate-500">{hint}</span>
                </span>
              </label>
            ))}
          </div>

          {mode === "range" ? (
            <div>
              <label className="text-sm font-medium text-slate-800">Page ranges</label>
              <input
                value={rangeInput}
                onChange={(e) => setRangeInput(e.target.value)}
                placeholder="1-3,5,7-9"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              {parsedPreview.length > 0 ? (
                <p className="mt-1 text-xs text-slate-500">Includes pages: {parsedPreview.join(", ")}</p>
              ) : null}
            </div>
          ) : null}

          {mode === "extract" && numPages > 0 ? (
            <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 p-2">
              <div className="grid grid-cols-4 gap-1">
                {Array.from({ length: numPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePage(p)}
                    className={`rounded-md py-1 text-xs font-medium ${
                      selected.has(p) ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <button
            type="button"
            disabled={!bytes || busy}
            onClick={() => void runSplit()}
            className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scissors className="h-4 w-4" />}
            Split &amp; download
          </button>
        </aside>
      </div>
    </ToolChrome>
  );
}
