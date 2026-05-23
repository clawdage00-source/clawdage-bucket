import type Handsontable from "handsontable";

import type { CellFormat, NumberFormatKind } from "@/lib/excel-editor/format-types";
import { inferCellMeta } from "@/lib/excel-editor/cell-meta";

const ALIGN_CLASS: Record<string, string> = {
  left: "htLeft",
  center: "htCenter",
  right: "htRight",
  top: "htTop",
  middle: "htMiddle",
  bottom: "htBottom",
};

function numberFormatMeta(kind: NumberFormatKind): Partial<Handsontable.CellMeta> {
  switch (kind) {
    case "currency":
      return { type: "numeric", numericFormat: { pattern: "₹0,0.00" } };
    case "percent":
      return { type: "numeric", numericFormat: { pattern: "0.00%" } };
    case "date":
      return { type: "date", dateFormat: "YYYY-MM-DD" };
    case "number":
      return { type: "numeric", numericFormat: { pattern: "0,0.00" } };
    default:
      return { type: "text" };
  }
}

export function buildFormatCellMeta(
  _row: number,
  _col: number,
  rawValue: unknown,
  format: CellFormat,
): Handsontable.CellMeta {
  const inferred = inferCellMeta(rawValue as string | number);
  const numberKind = format.numberFormat ?? "general";
  const numberMeta =
    numberKind !== "general" ? numberFormatMeta(numberKind) : { type: inferred.type };

  const classes: string[] = [];
  if (format.align) classes.push(ALIGN_CLASS[format.align] ?? "");
  if (format.valign) classes.push(ALIGN_CLASS[format.valign] ?? "");
  if (format.wrap) classes.push("htWrap");

  return {
    ...numberMeta,
    ...(inferred.type === "date" && numberKind === "general"
      ? { type: "date", dateFormat: inferred.dateFormat }
      : {}),
    ...(inferred.type === "numeric" && numberKind === "general"
      ? { type: "numeric", numericFormat: inferred.numericFormat }
      : {}),
    className: classes.filter(Boolean).join(" ") || undefined,
    renderer: "excelFormatted",
    excelFormat: format,
  } as Handsontable.CellMeta;
}
