"use client";

import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";

import { DropZone, ToolChrome, formatBytes } from "@/components/tools/shared-tool-chrome";
import { trackToolUse } from "@/lib/analytics";
import { downloadBlob } from "@/lib/download-blob";
import {
  parseBankStatementText,
  transactionsToCsv,
  transactionsToXlsx,
  type BankTransaction,
} from "@/lib/bank-statement-parser";
import { setupPdfJsWorker } from "@/lib/setup-pdfjs-worker";
import * as PDFJS from "pdfjs-dist";

setupPdfJsWorker();

export function BankStatementToExcelTool() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<BankTransaction[]>([]);

  const processFile = useCallback(async (f: File) => {
    setBusy(true);
    setError(null);
    setFile(f);
    setRows([]);
    try {
      const buf = new Uint8Array(await f.arrayBuffer());
      const task = PDFJS.getDocument({ data: buf });
      const doc = await task.promise;
      let fullText = "";
      for (let i = 1; i <= doc.numPages; i += 1) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        const line = content.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ");
        fullText += `${line}\n`;
      }
      await doc.destroy();
      const parsed = parseBankStatementText(fullText);
      if (parsed.length === 0) {
        setError("No transactions detected. Try a text-based PDF statement (not a scanned image).");
      }
      setRows(parsed);
      trackToolUse("bank-statement-to-excel", { count: parsed.length });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read PDF.");
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <ToolChrome
      title="Bank Statement to Excel"
      description="Extract transactions from bank statement PDFs, auto-categorize expenses, and export to XLSX or CSV — ideal for accountants, freelancers, and loan applications."
    >
      <div className="mx-auto max-w-4xl space-y-5">
        <DropZone
          accept="application/pdf,.pdf"
          label="Drop bank statement PDF"
          hint="Works best with digital/text PDFs from HDFC, SBI, ICICI, Axis, etc."
          onFiles={(files) => {
            const f = files[0];
            if (f) void processFile(f);
          }}
        />

        {file ? (
          <p className="text-sm text-slate-600">
            {file.name} · {formatBytes(file.size)} · {rows.length} transaction{rows.length === 1 ? "" : "s"} found
          </p>
        ) : null}

        {busy ? (
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" /> Extracting transactions…
          </p>
        ) : null}

        {error ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{error}</p>
        ) : null}

        {rows.length > 0 ? (
          <>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Description</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Debit</th>
                    <th className="px-3 py-2">Credit</th>
                    <th className="px-3 py-2">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 100).map((r, i) => (
                    <tr key={`${r.date}-${i}`} className="border-t border-slate-100">
                      <td className="px-3 py-2 whitespace-nowrap">{r.date}</td>
                      <td className="px-3 py-2 max-w-xs truncate">{r.description}</td>
                      <td className="px-3 py-2">{r.category}</td>
                      <td className="px-3 py-2">{r.debit ?? "—"}</td>
                      <td className="px-3 py-2">{r.credit ?? "—"}</td>
                      <td className="px-3 py-2">{r.balance ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 100 ? (
                <p className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
                  Showing first 100 of {rows.length} rows — full data included in export.
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  downloadBlob(
                    transactionsToXlsx(rows),
                    `${file?.name.replace(/\.pdf$/i, "") || "statement"}.xlsx`,
                    "bank-statement-to-excel",
                  )
                }
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <FileSpreadsheet className="h-4 w-4" /> Export XLSX
              </button>
              <button
                type="button"
                onClick={() =>
                  downloadBlob(
                    transactionsToCsv(rows),
                    `${file?.name.replace(/\.pdf$/i, "") || "statement"}.csv`,
                    "bank-statement-to-excel",
                  )
                }
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                <Download className="h-4 w-4" /> Export CSV
              </button>
            </div>
          </>
        ) : null}
      </div>
    </ToolChrome>
  );
}
