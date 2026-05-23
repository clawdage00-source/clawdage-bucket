import type Handsontable from "handsontable";

export type CellRange = { rowStart: number; colStart: number; rowEnd: number; colEnd: number };

export function getSelectedRanges(hot: Handsontable.Core): CellRange[] {
  const selected = hot.getSelected();
  if (!selected?.length) return [];

  return selected
    .map(([r1, c1, r2, c2]) => ({
      rowStart: Math.min(r1, r2),
      colStart: Math.min(c1, c2),
      rowEnd: Math.max(r1, r2),
      colEnd: Math.max(c1, c2),
    }))
    .filter((r) => r.rowStart >= 0 && r.colStart >= 0);
}

export function getPrimarySelection(hot: Handsontable.Core): CellRange | null {
  const ranges = getSelectedRanges(hot);
  return ranges[0] ?? null;
}
