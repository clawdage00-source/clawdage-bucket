import autoTable from "jspdf-autotable";
import type { CellHookData } from "jspdf-autotable";
import { jsPDF } from "jspdf";

import type { ExportSheetPayload } from "@/lib/excel-editor/export-values";
import type { HorizontalAlign } from "@/lib/excel-editor/format-types";

type PdfAlign = "left" | "center" | "right";

const BODY_FONT_SIZE = 7.5;
const HEAD_FONT_SIZE = 8;
const CELL_H_PAD = 3;
const MIN_COL_MM = 14;
const MAX_COL_MM = 48;

function toPdfAlign(a: HorizontalAlign): PdfAlign {
  return a;
}

function isNumericCell(value: string): boolean {
  const v = value.replace(/,/g, "").trim();
  return v !== "" && !Number.isNaN(Number(v));
}

function defaultColumnAlign(
  colIdx: number,
  rows: string[][],
  alignments: HorizontalAlign[][],
): PdfAlign {
  const fromFormat = alignments.map((row) => row[colIdx]).find(Boolean);
  if (fromFormat) return toPdfAlign(fromFormat);
  if (rows.some((r) => isNumericCell(r[colIdx] ?? ""))) return "right";
  return "left";
}

/** Measure column width in mm using the active PDF font metrics. */
function measureTextMm(doc: jsPDF, text: string, fontSize: number): number {
  doc.setFontSize(fontSize);
  return doc.getTextWidth(text || " ");
}

function buildNaturalColumnWidths(
  doc: jsPDF,
  headers: string[],
  rows: string[][],
): number[] {
  const sampleRows = rows.length > 80 ? rows.slice(0, 80) : rows;

  return headers.map((header, colIdx) => {
    let maxMm = measureTextMm(doc, header.trim() || `Col ${colIdx + 1}`, HEAD_FONT_SIZE);

    for (const row of sampleRows) {
      const cell = String(row[colIdx] ?? "");
      if (!cell) continue;
      maxMm = Math.max(maxMm, measureTextMm(doc, cell, BODY_FONT_SIZE));
    }

    const padded = maxMm + CELL_H_PAD * 2;
    return Math.min(MAX_COL_MM, Math.max(MIN_COL_MM, padded));
  });
}

function pickOrientation(colCount: number, totalTableWidth: number): "portrait" | "landscape" {
  if (colCount >= 5) return "landscape";
  if (totalTableWidth > 190) return "landscape";
  return "portrait";
}

export function exportSheetToPdf(payload: ExportSheetPayload, fileName: string): void {
  const { headers, rows, alignments } = payload;
  if (headers.length === 0) {
    throw new Error("No columns to export.");
  }

  const probe = new jsPDF({ unit: "mm", format: "a4" });
  probe.setFont("helvetica", "normal");

  const columnWidths = buildNaturalColumnWidths(probe, headers, rows);
  const naturalTableWidth = columnWidths.reduce((sum, w) => sum + w, 0);
  const orientation = pickOrientation(headers.length, naturalTableWidth);

  const doc = new jsPDF({ orientation, unit: "mm", format: "a4" });
  doc.setFont("helvetica", "normal");

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = { top: 12, right: 10, bottom: 12, left: 10 };
  const innerWidth = pageWidth - margin.left - margin.right;

  const columnStyles: Record<number, { cellWidth: number; halign: PdfAlign; overflow: "linebreak" }> =
    {};
  for (let c = 0; c < headers.length; c++) {
    columnStyles[c] = {
      cellWidth: columnWidths[c]!,
      halign: defaultColumnAlign(c, rows, alignments),
      overflow: "linebreak",
    };
  }

  const tableFitsPage = naturalTableWidth <= innerWidth;
  const tableWidth = tableFitsPage ? innerWidth : naturalTableWidth;

  if (!tableFitsPage) {
    for (let c = 0; c < headers.length; c++) {
      columnStyles[c]!.cellWidth = columnWidths[c]!;
    }
  } else {
    const extra = innerWidth - naturalTableWidth;
    const perCol = extra / headers.length;
    for (let c = 0; c < headers.length; c++) {
      columnStyles[c]!.cellWidth = columnWidths[c]! + perCol;
    }
  }

  autoTable(doc, {
    head: [headers.map((h) => h.trim() || " ")],
    body: rows.length > 0 ? rows : [["(empty sheet)"]],
    startY: margin.top,
    margin,
    tableWidth,
    styles: {
      font: "helvetica",
      fontSize: BODY_FONT_SIZE,
      cellPadding: { top: 2, right: CELL_H_PAD, bottom: 2, left: CELL_H_PAD },
      overflow: "linebreak",
      valign: "middle",
      lineWidth: 0.15,
      lineColor: [180, 180, 180],
      halign: "left",
      minCellHeight: 5,
    },
    headStyles: {
      fillColor: [37, 30, 255],
      textColor: 255,
      fontStyle: "bold",
      fontSize: HEAD_FONT_SIZE,
      halign: "center",
      valign: "middle",
      cellPadding: { top: 2.5, right: CELL_H_PAD, bottom: 2.5, left: CELL_H_PAD },
      overflow: "linebreak",
    },
    bodyStyles: {
      valign: "middle",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles,
    didParseCell: (hook: CellHookData) => {
      if (hook.section === "body" && rows.length > 0) {
        const align = alignments[hook.row.index]?.[hook.column.index];
        if (align) {
          hook.cell.styles.halign = toPdfAlign(align);
        }
      }
      if (hook.section === "head") {
        hook.cell.styles.halign = "center";
      }
    },
    showHead: "everyPage",
    horizontalPageBreak: !tableFitsPage,
    horizontalPageBreakRepeat: 0,
    rowPageBreak: "auto",
    theme: "grid",
  });

  doc.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
}
