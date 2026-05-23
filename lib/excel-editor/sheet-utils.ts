export type SheetMatrix = (string | number)[][];

export function padRow(row: SheetMatrix[number], length: number): (string | number)[] {
  const out = row.map((c) => (c === null || c === undefined ? "" : c));
  while (out.length < length) out.push("");
  return out.slice(0, length);
}

/** Merge column headers + body into one matrix (row 0 = current headers). */
export function mergeSheet(colHeaders: string[], body: SheetMatrix): SheetMatrix {
  return [colHeaders.map((c) => String(c)), ...body];
}

/**
 * Pick which row in `full` becomes column titles; other rows become body.
 * @param headerIndex 0-based index in `full`, or null for auto-generated Column 1…N headers.
 */
export function splitHeaderRow(
  full: SheetMatrix,
  headerIndex: number | null,
): { headers: string[]; data: SheetMatrix } {
  if (full.length === 0) {
    return { headers: ["Column 1"], data: [] };
  }

  const maxCols = Math.max(1, ...full.map((r) => r.length));

  if (headerIndex === null || headerIndex < 0) {
    const headers = Array.from({ length: maxCols }, (_, i) => `Column ${i + 1}`);
    const data = full.map((row) => padRow(row, maxCols));
    return { headers, data };
  }

  const idx = Math.min(headerIndex, full.length - 1);
  const headers = padRow(
    (full[idx] ?? []).map((c) => (c === null || c === undefined ? "" : c)),
    maxCols,
  ).map(String);
  const data = full
    .filter((_, i) => i !== idx)
    .map((row) => padRow(row.map((c) => (c === null || c === undefined ? "" : c)), maxCols));

  return { headers, data };
}
