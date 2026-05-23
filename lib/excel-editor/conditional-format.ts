import type Handsontable from "handsontable";

import type { CellFormatStore } from "@/lib/excel-editor/cell-format-store";
import type { ConditionalRule } from "@/lib/excel-editor/format-types";

function parseNum(s: string): number | null {
  const n = Number(String(s).replace(/[,%₹$]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function cellMatches(rule: ConditionalRule, raw: unknown): boolean {
  const text = raw === null || raw === undefined ? "" : String(raw);
  const n = parseNum(text);
  const v = parseNum(rule.value);
  const v2 = rule.value2 !== undefined ? parseNum(rule.value2) : null;

  switch (rule.operator) {
    case "contains":
      return text.toLowerCase().includes(rule.value.toLowerCase());
    case "eq":
      if (v !== null && n !== null) return n === v;
      return text === rule.value;
    case "gt":
      return n !== null && v !== null && n > v;
    case "gte":
      return n !== null && v !== null && n >= v;
    case "lt":
      return n !== null && v !== null && n < v;
    case "lte":
      return n !== null && v !== null && n <= v;
    case "between":
      return n !== null && v !== null && v2 !== null && n >= v && n <= v2;
    default:
      return false;
  }
}

export function applyConditionalFormatting(
  hot: Handsontable.Core,
  store: CellFormatStore,
): void {
  const rules = store.getRules();
  store.clearConditionalOverlays();

  if (rules.length === 0) return;

  const rows = hot.countRows();
  const cols = hot.countCols();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const value = hot.getDataAtCell(r, c);
      for (const rule of rules) {
        if (cellMatches(rule, value)) {
          store.setConditionalOverlay(r, c, rule.format);
          break;
        }
      }
    }
  }
}
