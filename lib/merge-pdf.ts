import { PDFDocument } from "pdf-lib";

export type MergeProgress = { done: number; total: number };

export async function readPdfPageCount(bytes: Uint8Array): Promise<number> {
  const doc = await PDFDocument.load(bytes);
  return doc.getPageCount();
}

export async function mergePdfBytes(
  sources: Uint8Array[],
  onProgress?: (progress: MergeProgress) => void,
): Promise<Uint8Array> {
  if (sources.length === 0) {
    throw new Error("Add at least one PDF to merge.");
  }

  const merged = await PDFDocument.create();
  const total = sources.length;

  for (let i = 0; i < sources.length; i += 1) {
    const bytes = sources[i];
    if (!bytes) continue;
    const src = await PDFDocument.load(bytes);
    const indices = src.getPageIndices();
    const pages = await merged.copyPages(src, indices);
    pages.forEach((page) => merged.addPage(page));
    onProgress?.({ done: i + 1, total });
  }

  return merged.save();
}

export function mergeErrorMessage(err: unknown, fileName?: string): string {
  const label = fileName ? ` (${fileName})` : "";
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();

  if (lower.includes("encrypt") || lower.includes("password")) {
    return `This PDF is password-protected${label}. Remove the password in another app, then try again.`;
  }
  if (lower.includes("invalid") || lower.includes("parse") || lower.includes("corrupt")) {
    return `Could not read this PDF${label}. The file may be damaged or not a valid PDF.`;
  }
  return `Could not merge${label}. ${raw}`;
}
