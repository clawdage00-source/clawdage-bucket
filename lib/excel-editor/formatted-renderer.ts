import Handsontable from "handsontable";
import { registerRenderer } from "handsontable/renderers/registry";
import { textRenderer } from "handsontable/renderers/textRenderer";

import type { CellFormat } from "@/lib/excel-editor/format-types";

export const EXCEL_FORMATTED_RENDERER = "excelFormatted";

function applyFormatToTd(td: HTMLTableCellElement, format: CellFormat) {
  if (format.fontFamily) td.style.fontFamily = format.fontFamily;
  if (format.fontSize) td.style.fontSize = `${format.fontSize}px`;
  if (format.fontColor) td.style.color = format.fontColor;
  if (format.bgColor) td.style.backgroundColor = format.bgColor;

  td.style.fontWeight = format.bold ? "700" : "";
  td.style.fontStyle = format.italic ? "italic" : "";
  td.style.textDecoration = format.underline ? "underline" : "";

  if (format.rotation) {
    td.style.verticalAlign = "middle";
    td.style.whiteSpace = "nowrap";
    const inner = td.querySelector(".excel-cell-inner") ?? (() => {
      const span = document.createElement("div");
      span.className = "excel-cell-inner";
      while (td.firstChild) span.appendChild(td.firstChild);
      td.appendChild(span);
      return span;
    })();
    (inner as HTMLElement).style.display = "inline-block";
    (inner as HTMLElement).style.transform = `rotate(${format.rotation}deg)`;
    (inner as HTMLElement).style.transformOrigin = "center center";
  }
}

type CellMetaWithFormat = Handsontable.CellMeta & { excelFormat?: CellFormat };

registerRenderer(EXCEL_FORMATTED_RENDERER, function excelFormattedRenderer(
  instance: Handsontable.Core,
  td: HTMLTableCellElement,
  row: number,
  column: number,
  prop: string | number,
  value: unknown,
  cellProperties: Handsontable.CellProperties,
) {
  const baseRenderer =
    cellProperties.type === "numeric"
      ? Handsontable.renderers.getRenderer("numeric")
      : cellProperties.type === "date"
        ? Handsontable.renderers.getRenderer("date")
        : textRenderer;

  baseRenderer(instance, td, row, column, prop, value, cellProperties);

  td.style.fontWeight = "";
  td.style.fontStyle = "";
  td.style.textDecoration = "";
  td.style.color = "";
  td.style.backgroundColor = "";
  td.style.fontFamily = "";
  td.style.fontSize = "";

  const fmt = (cellProperties as CellMetaWithFormat).excelFormat;
  if (fmt) applyFormatToTd(td, fmt);
});
