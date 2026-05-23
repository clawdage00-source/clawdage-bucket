/** Convert 0-based column index to Excel-style letters (A, B, …, AA). */
export function columnIndexToLabel(index: number): string {
  let n = index + 1;
  let label = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    label = String.fromCharCode(65 + rem) + label;
    n = Math.floor((n - 1) / 26);
  }
  return label;
}

export function formatCellAddress(col: number, row: number): string {
  return `${columnIndexToLabel(col)}${row + 1}`;
}
