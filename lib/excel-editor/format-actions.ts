import type Handsontable from "handsontable";

import type { CellFormatStore } from "@/lib/excel-editor/cell-format-store";
import { applyConditionalFormatting } from "@/lib/excel-editor/conditional-format";
import type { CellFormat, ConditionalRule } from "@/lib/excel-editor/format-types";
import { getSelectedRanges } from "@/lib/excel-editor/selection-utils";

export function applyFormatToSelection(
  hot: Handsontable.Core,
  store: CellFormatStore,
  patch: Partial<CellFormat>,
): void {
  const ranges = getSelectedRanges(hot);
  if (!ranges.length) return;

  for (const { rowStart, colStart, rowEnd, colEnd } of ranges) {
    store.mergeRange(rowStart, colStart, rowEnd, colEnd, patch);
  }
  hot.render();
}

export function refreshConditionalFormatting(
  hot: Handsontable.Core,
  store: CellFormatStore,
): void {
  applyConditionalFormatting(hot, store);
  hot.render();
}

export function setConditionalRules(
  hot: Handsontable.Core,
  store: CellFormatStore,
  rules: ConditionalRule[],
): void {
  store.setRules(rules);
  refreshConditionalFormatting(hot, store);
}

const BORDER_LINE = { width: 1, color: "#334155" };

export function applyBordersToSelection(
  hot: Handsontable.Core,
  mode: "all" | "outer" | "none",
): void {
  const borders = hot.getPlugin("customBorders");
  const selected = hot.getSelected();
  if (!selected?.length) return;

  if (mode === "none") {
    borders.clearBorders(selected);
    hot.render();
    return;
  }

  const descriptor =
    mode === "all"
      ? {
          top: BORDER_LINE,
          bottom: BORDER_LINE,
          left: BORDER_LINE,
          right: BORDER_LINE,
        }
      : {
          top: BORDER_LINE,
          bottom: BORDER_LINE,
          left: BORDER_LINE,
          right: BORDER_LINE,
        };

  borders.setBorders(selected, descriptor);
  hot.render();
}

export function mergeSelectedCells(hot: Handsontable.Core): void {
  hot.getPlugin("mergeCells").mergeSelection();
  hot.render();
}

export function unmergeSelectedCells(hot: Handsontable.Core): void {
  hot.getPlugin("mergeCells").unmergeSelection();
  hot.render();
}
