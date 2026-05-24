import { jsPDF } from "jspdf";
import * as PDFJS from "pdfjs-dist";

import { setupPdfJsWorker } from "@/lib/setup-pdfjs-worker";

setupPdfJsWorker();

export async function unlockPdfFile(
  bytes: Uint8Array,
  password?: string,
): Promise<Uint8Array> {
  const task = PDFJS.getDocument({
    data: bytes.slice(),
    password: password?.trim() || undefined,
  });
  const pdf = await task.promise;

  const first = await pdf.getPage(1);
  const baseViewport = first.getViewport({ scale: 1 });
  const doc = new jsPDF({
    orientation: baseViewport.width > baseViewport.height ? "landscape" : "portrait",
    unit: "pt",
    format: [baseViewport.width, baseViewport.height],
  });

  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;

    const pageViewport = page.getViewport({ scale: 1 });
    if (i > 1) {
      doc.addPage([pageViewport.width, pageViewport.height]);
    }
    doc.addImage(
      canvas.toDataURL("image/jpeg", 0.92),
      "JPEG",
      0,
      0,
      pageViewport.width,
      pageViewport.height,
    );
  }

  await pdf.destroy();
  return new Uint8Array(doc.output("arraybuffer"));
}

export function unlockErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/password|encrypted|incorrect|needs password/i.test(msg)) {
    return "Wrong password or this PDF needs a password to unlock.";
  }
  if (/invalid|corrupt/i.test(msg)) {
    return "This file does not look like a valid PDF.";
  }
  return "Could not unlock this PDF. Check the password and try again.";
}
