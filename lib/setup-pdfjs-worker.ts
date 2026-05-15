import { GlobalWorkerOptions, version } from "pdfjs-dist";

let configured = false;

/**
 * Configure PDF.js worker for browser use (Next.js / Turbopack safe).
 * Serves the worker from /public so we never rely on CDN .min.js URLs or import.meta.url resolution.
 */
export function setupPdfJsWorker(): void {
  if (configured || typeof window === "undefined") return;

  GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  configured = true;
}

/** @internal For debugging version mismatches between app and public worker file */
export function getPdfJsVersion(): string {
  return version;
}
