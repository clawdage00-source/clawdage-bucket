import { PDFDocument } from "pdf-lib";

export type SplitOutput = { filename: string; bytes: Uint8Array };

/** Parse "1-3,5,7-9" into sorted unique 1-based page numbers. */
export function parsePageSelection(input: string, totalPages: number): number[] {
  const pages = new Set<number>();
  const parts = input.split(",").map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    if (/^\d+$/.test(part)) {
      const n = Number(part);
      if (n >= 1 && n <= totalPages) pages.add(n);
      continue;
    }
    const m = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      const start = Math.min(Number(m[1]), Number(m[2]));
      const end = Math.max(Number(m[1]), Number(m[2]));
      for (let i = start; i <= end; i += 1) {
        if (i >= 1 && i <= totalPages) pages.add(i);
      }
    }
  }
  return [...pages].sort((a, b) => a - b);
}

async function copyPages(source: PDFDocument, pageIndices: number[]): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  const copied = await out.copyPages(source, pageIndices);
  copied.forEach((p) => out.addPage(p));
  return out.save({ useObjectStreams: false });
}

export async function extractPages(bytes: Uint8Array, pages1Based: number[]): Promise<Uint8Array> {
  const src = await PDFDocument.load(bytes);
  const total = src.getPageCount();
  const indices = pages1Based
    .filter((p) => p >= 1 && p <= total)
    .map((p) => p - 1);
  if (indices.length === 0) throw new Error("No valid pages selected.");
  return copyPages(src, indices);
}

export async function splitEveryPage(bytes: Uint8Array, baseName: string): Promise<SplitOutput[]> {
  const src = await PDFDocument.load(bytes);
  const total = src.getPageCount();
  const outputs: SplitOutput[] = [];
  for (let i = 0; i < total; i += 1) {
    const pageBytes = await copyPages(src, [i]);
    outputs.push({
      filename: `${baseName}-page-${i + 1}.pdf`,
      bytes: pageBytes,
    });
  }
  return outputs;
}

export async function splitByRanges(
  bytes: Uint8Array,
  rangeInput: string,
  baseName: string,
): Promise<SplitOutput[]> {
  const src = await PDFDocument.load(bytes);
  const total = src.getPageCount();
  const parts = rangeInput.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) throw new Error("Enter a page range like 1-3,5,7.");

  const outputs: SplitOutput[] = [];
  for (const part of parts) {
    const pages = parsePageSelection(part, total);
    if (pages.length === 0) continue;
    const pageBytes = await copyPages(
      src,
      pages.map((p) => p - 1),
    );
    const label =
      pages.length === 1
        ? `page-${pages[0]}`
        : `pages-${pages[0]}-${pages[pages.length - 1]}`;
    outputs.push({
      filename: `${baseName}-${label}.pdf`,
      bytes: pageBytes,
    });
  }
  if (outputs.length === 0) throw new Error("No valid page ranges found.");
  return outputs;
}

export function splitErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/password|encrypted/i.test(msg)) return "This PDF is password-protected. Unlock it first.";
  return msg || "Could not split this PDF.";
}
