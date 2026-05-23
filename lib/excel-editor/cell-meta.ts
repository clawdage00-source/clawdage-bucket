import type { CellValue } from "handsontable/common";

export type InferredCellType = "text" | "numeric" | "date";

const DATE_PATTERNS = [
  /^\d{4}-\d{2}-\d{2}$/,
  /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,
  /^\d{1,2}-\d{1,2}-\d{2,4}$/,
];

export function inferCellType(value: CellValue): InferredCellType {
  if (value === null || value === undefined || value === "") return "text";
  const s = String(value).trim();
  if (s.startsWith("=")) return "text";
  if (!Number.isNaN(Number(s)) && s !== "" && !/^0\d+$/.test(s)) return "numeric";
  if (DATE_PATTERNS.some((p) => p.test(s))) return "date";
  return "text";
}

export function inferCellMeta(value: CellValue): {
  type: InferredCellType;
  numericFormat?: { pattern: string };
  dateFormat?: string;
} {
  const type = inferCellType(value);
  if (type === "numeric") {
    return { type: "numeric", numericFormat: { pattern: "0,0.00" } };
  }
  if (type === "date") {
    return { type: "date", dateFormat: "YYYY-MM-DD" };
  }
  return { type: "text" };
}
