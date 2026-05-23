import type { CellFormat, ConditionalRule } from "@/lib/excel-editor/format-types";
import { cellKey } from "@/lib/excel-editor/format-types";

export class CellFormatStore {
  private readonly cells = new Map<string, CellFormat>();
  private conditional = new Map<string, Partial<CellFormat>>();
  private rules: ConditionalRule[] = [];

  get(row: number, col: number): CellFormat {
    const base = this.cells.get(cellKey(row, col)) ?? {};
    const overlay = this.conditional.get(cellKey(row, col)) ?? {};
    return { ...base, ...overlay };
  }

  merge(row: number, col: number, patch: Partial<CellFormat>): void {
    const key = cellKey(row, col);
    const prev = this.cells.get(key) ?? {};
    this.cells.set(key, { ...prev, ...patch });
  }

  mergeRange(
    r1: number,
    c1: number,
    r2: number,
    c2: number,
    patch: Partial<CellFormat>,
  ): void {
    const top = Math.min(r1, r2);
    const bottom = Math.max(r1, r2);
    const left = Math.min(c1, c2);
    const right = Math.max(c1, c2);
    for (let r = top; r <= bottom; r++) {
      for (let c = left; c <= right; c++) {
        this.merge(r, c, patch);
      }
    }
  }

  clear(): void {
    this.cells.clear();
    this.conditional.clear();
    this.rules = [];
  }

  getRules(): ConditionalRule[] {
    return [...this.rules];
  }

  setRules(rules: ConditionalRule[]): void {
    this.rules = rules;
    this.conditional.clear();
  }

  setConditionalOverlay(row: number, col: number, patch: Partial<CellFormat> | null): void {
    const key = cellKey(row, col);
    if (!patch || Object.keys(patch).length === 0) {
      this.conditional.delete(key);
      return;
    }
    this.conditional.set(key, patch);
  }

  clearConditionalOverlays(): void {
    this.conditional.clear();
  }

  exportState(): {
    cells: Record<string, CellFormat>;
    rules: ConditionalRule[];
  } {
    return {
      cells: Object.fromEntries(this.cells.entries()),
      rules: [...this.rules],
    };
  }

  static importState(data: {
    cells?: Record<string, CellFormat>;
    rules?: ConditionalRule[];
  }): CellFormatStore {
    const store = new CellFormatStore();
    if (data.cells) {
      for (const [key, fmt] of Object.entries(data.cells)) {
        store.cells.set(key, fmt);
      }
    }
    if (data.rules?.length) {
      store.rules = [...data.rules];
    }
    return store;
  }
}
