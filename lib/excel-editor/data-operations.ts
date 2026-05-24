import type Handsontable from "handsontable";

import { getPrimarySelection } from "@/lib/excel-editor/selection-utils";

export type SortMode = "text-asc" | "text-desc" | "numeric-asc" | "numeric-desc";

function parseNumeric(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
}

export function getSortColumn(hot: Handsontable.Core): number | null {
  const sel = getPrimarySelection(hot);
  if (sel) return sel.colStart;
  const selected = hot.getSelectedLast();
  if (!selected) return null;
  const col = selected[1];
  return col !== undefined && col >= 0 ? col : null;
}

export function sortByColumn(hot: Handsontable.Core, column: number, mode: SortMode): void {
  const sorting = hot.getPlugin("columnSorting");
  if (!sorting.isEnabled()) sorting.enablePlugin();

  if (mode === "text-asc" || mode === "text-desc") {
    sorting.sort({
      column,
      sortOrder: mode === "text-asc" ? "asc" : "desc",
    });
    return;
  }

  const data = hot.getData() as (string | number)[][];
  const asc = mode === "numeric-asc";
  const indexed = data.map((row, index) => ({ row, index }));
  indexed.sort((a, b) => {
    const na = parseNumeric(a.row[column]);
    const nb = parseNumeric(b.row[column]);
    if (na === null && nb === null) return a.index - b.index;
    if (na === null) return 1;
    if (nb === null) return -1;
    return asc ? na - nb : nb - na;
  });
  hot.loadData(indexed.map((entry) => entry.row));
}

export function removeDuplicateRows(hot: Handsontable.Core): number {
  const data = hot.getData() as (string | number)[][];
  const seen = new Set<string>();
  const duplicateRows: number[] = [];

  data.forEach((row, index) => {
    const key = row.map((c) => String(c ?? "").trim()).join("\u001f");
    if (seen.has(key)) duplicateRows.push(index);
    else seen.add(key);
  });

  for (const row of [...duplicateRows].sort((a, b) => b - a)) {
    hot.alter("remove_row", row, 1);
  }

  return duplicateRows.length;
}

export function enableStructuredTable(hot: Handsontable.Core): void {
  const filters = hot.getPlugin("filters");
  if (!filters.isEnabled()) filters.enablePlugin();

  hot.updateSettings({
    filters: true,
    dropdownMenu: {
      items: {
        filter_by_condition: {},
        filter_by_value: {},
        filter_action_bar: {},
      },
    },
  });

  hot.render();
}

export function clearAllFilters(hot: Handsontable.Core): void {
  const filters = hot.getPlugin("filters");
  if (filters.isEnabled()) {
    filters.clearConditions();
    filters.filter();
  }
}
