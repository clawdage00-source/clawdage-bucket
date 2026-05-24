import { columnIndexToLabel } from "@/lib/excel-editor/cell-address";

export type NamedRange = {
  name: string;
  rowStart: number;
  colStart: number;
  rowEnd: number;
  colEnd: number;
};

const NAME_RE = /^[A-Za-z_][A-Za-z0-9_.]*$/;

export function isValidRangeName(name: string): boolean {
  return NAME_RE.test(name.trim());
}

export function formatRangeRef(range: NamedRange): string {
  const start = `${columnIndexToLabel(range.colStart)}${range.rowStart + 1}`;
  const end = `${columnIndexToLabel(range.colEnd)}${range.rowEnd + 1}`;
  if (start === end) return start;
  return `${start}:${end}`;
}

export class NamedRangesStore {
  private readonly ranges = new Map<string, NamedRange>();

  list(): NamedRange[] {
    return [...this.ranges.values()];
  }

  get(name: string): NamedRange | undefined {
    return this.ranges.get(name.toUpperCase());
  }

  define(name: string, range: Omit<NamedRange, "name">): boolean {
    const trimmed = name.trim();
    if (!isValidRangeName(trimmed)) return false;
    const key = trimmed.toUpperCase();
    this.ranges.set(key, { name: trimmed, ...range });
    return true;
  }

  remove(name: string): void {
    this.ranges.delete(name.trim().toUpperCase());
  }

  exportState(): NamedRange[] {
    return this.list();
  }

  static importState(data: NamedRange[] | undefined): NamedRangesStore {
    const store = new NamedRangesStore();
    for (const item of data ?? []) {
      if (item?.name) {
        store.define(item.name, {
          rowStart: item.rowStart,
          colStart: item.colStart,
          rowEnd: item.rowEnd,
          colEnd: item.colEnd,
        });
      }
    }
    return store;
  }
}
