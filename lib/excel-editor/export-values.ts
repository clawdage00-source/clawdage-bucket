import type Handsontable from "handsontable";

import type { CellFormatStore } from "@/lib/excel-editor/cell-format-store";
import type { HorizontalAlign } from "@/lib/excel-editor/format-types";

export type ExportSheetPayload = {
  headers: string[];
  rows: string[][];
  alignments: HorizontalAlign[][];
};

function formatExportValue(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  if (typeof val === "number") {
    if (!Number.isFinite(val)) return "";
    if (Number.isInteger(val)) return String(val);
    const rounded = Math.round(val * 1_000_000) / 1_000_000;
    return String(rounded);
  }
  if (val instanceof Date) {
    return val.toISOString().slice(0, 10);
  }
  return String(val).trim();
}

/** Resolved display value (formula results, not formula strings). */
export function getDisplayCellValue(hot: Handsontable.Core, row: number, col: number): string {
  const formulas = hot.getPlugin("formulas");
  if (formulas?.isEnabled?.() && formulas.engine && formulas.sheetId !== null) {
    try {
      if (formulas.isFormulaCellType(row, col)) {
        const val = formulas.engine.getCellValue({ sheet: formulas.sheetId, row, col });
        return formatExportValue(val);
      }
    } catch {
      /* fall through to raw */
    }
  }

  const raw = hot.getDataAtCell(row, col);
  if (raw === null || raw === undefined) return "";
  const s = String(raw).trim();
  if (s.startsWith("=")) {
    if (formulas?.isEnabled?.() && formulas.engine && formulas.sheetId !== null) {
      try {
        return formatExportValue(
          formulas.engine.getCellValue({ sheet: formulas.sheetId, row, col }),
        );
      } catch {
        return s;
      }
    }
  }
  return s;
}

function isRowEmpty(row: string[]): boolean {
  return row.every((c) => c === "");
}

function defaultAlignForValue(value: string): HorizontalAlign {
  const n = Number(String(value).replace(/,/g, ""));
  if (value !== "" && !Number.isNaN(n)) return "right";
  return "left";
}

export function buildExportPayload(
  hot: Handsontable.Core,
  formatStore: CellFormatStore | null,
): ExportSheetPayload {
  const headers = (hot.getColHeader() as string[]).map((h) => String(h ?? ""));
  const rowCount = hot.countRows();
  const colCount = headers.length;

  const rows: string[][] = [];
  const alignments: HorizontalAlign[][] = [];

  for (let r = 0; r < rowCount; r++) {
    const row: string[] = [];
    const rowAlign: HorizontalAlign[] = [];
    for (let c = 0; c < colCount; c++) {
      const value = getDisplayCellValue(hot, r, c);
      row.push(value);
      const fmt = formatStore?.get(r, c);
      rowAlign.push(fmt?.align ?? defaultAlignForValue(value));
    }
    rows.push(row);
    alignments.push(rowAlign);
  }

  let lastDataRow = rows.length - 1;
  while (lastDataRow >= 0 && isRowEmpty(rows[lastDataRow]!)) {
    lastDataRow -= 1;
  }
  const trimmedRows = rows.slice(0, lastDataRow + 1);
  const trimmedAlign = alignments.slice(0, lastDataRow + 1);

  let lastCol = colCount - 1;
  while (lastCol >= 0) {
    const headerEmpty = (headers[lastCol] ?? "").trim() === "";
    const colEmpty =
      headerEmpty &&
      trimmedRows.every((row) => (row[lastCol] ?? "").trim() === "");
    if (!colEmpty) break;
    lastCol -= 1;
  }

  const finalHeaders = headers.slice(0, lastCol + 1).map((h, i) => {
    const t = h.trim();
    return t || `Column ${i + 1}`;
  });

  const keepCol = finalHeaders.map((header, colIdx) => {
    const generic = /^Column \d+$/i.test(header);
    const hasData = trimmedRows.some((row) => (row[colIdx] ?? "").trim() !== "");
    return !generic || hasData;
  });

  const filteredHeaders = finalHeaders.filter((_, i) => keepCol[i]);
  const filteredRows = trimmedRows.map((row) =>
    row.filter((_, i) => keepCol[i]),
  );
  const filteredAlign = trimmedAlign.map((row) =>
    row.filter((_, i) => keepCol[i]),
  );

  const finalRows = filteredRows.map((row) => {
    while (row.length < filteredHeaders.length) row.push("");
    return row;
  });

  const finalAlign = filteredAlign.map((row) => {
    while (row.length < filteredHeaders.length) row.push("left");
    return row;
  });

  return { headers: filteredHeaders, rows: finalRows, alignments: finalAlign };
}

export function buildExportPayloadFromState(
  headers: string[],
  rows: (string | number)[][],
  formatStore: CellFormatStore | null,
): ExportSheetPayload {
  const h = headers.map((x) => String(x ?? ""));
  const body = rows.map((row) =>
    row.map((cell) => {
      const value = cell === null || cell === undefined ? "" : String(cell).trim();
      return value.startsWith("=") ? value : formatExportValue(cell);
    }),
  );
  const alignments = body.map((row) =>
    row.map((value, ci) => {
      const fmt = formatStore?.get(0, ci);
      return fmt?.align ?? defaultAlignForValue(value);
    }),
  );
  return { headers: h, rows: body, alignments };
}
