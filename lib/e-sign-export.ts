import type { CSSProperties } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export type ImageStamp = {
  id: string;
  kind: "image";
  pageIndex: number;
  pdfX: number;
  pdfY: number;
  pdfW: number;
  pdfH: number;
  pngBytes: Uint8Array;
};

/** Grow or shrink a signature box; keeps aspect ratio and approximate center, clamps to page. */
export function resizeImageStampCentered(
  stamp: ImageStamp,
  pageW: number,
  pageH: number,
  factor: number,
): ImageStamp {
  const aspect = stamp.pdfH / Math.max(1e-6, stamp.pdfW);
  let newW = stamp.pdfW * factor;
  const minW = 28;
  const maxW = pageW * 0.95;
  newW = Math.min(Math.max(newW, minW), maxW);
  const newH = newW * aspect;
  const cx = stamp.pdfX + stamp.pdfW / 2;
  const cy = stamp.pdfY + stamp.pdfH / 2;
  let newX = cx - newW / 2;
  let newY = cy - newH / 2;
  newX = Math.max(0, Math.min(newX, pageW - newW));
  newY = Math.max(0, Math.min(newY, pageH - newH));
  return { ...stamp, pdfX: newX, pdfY: newY, pdfW: newW, pdfH: newH };
}

export type TextStamp = {
  id: string;
  kind: "text";
  pageIndex: number;
  pdfX: number;
  pdfY: number;
  text: string;
  fontSize: number;
};

export type ESignStamp = ImageStamp | TextStamp;

const WATERMARK = "Signed via Clawdage";

export async function buildSignedPdf(
  pdfBytes: Uint8Array,
  stamps: ESignStamp[],
  options: { watermarkFooter: boolean },
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes);
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();

  for (const s of stamps) {
    const page = pages[s.pageIndex];
    if (!page) continue;
    if (s.kind === "image") {
      const img = await doc.embedPng(s.pngBytes);
      page.drawImage(img, { x: s.pdfX, y: s.pdfY, width: s.pdfW, height: s.pdfH });
    } else {
      page.drawText(s.text, {
        x: s.pdfX,
        y: s.pdfY,
        size: s.fontSize,
        font: helvetica,
        color: rgb(0.08, 0.09, 0.12),
      });
    }
  }

  if (options.watermarkFooter) {
    for (const page of pages) {
      page.drawText(WATERMARK, {
        x: 40,
        y: 18,
        size: 7,
        font: helvetica,
        color: rgb(0.42, 0.45, 0.5),
      });
    }
  }

  return doc.save();
}

export function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const i = dataUrl.indexOf(",");
  const b64 = i >= 0 ? dataUrl.slice(i + 1) : dataUrl;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let j = 0; j < bin.length; j += 1) out[j] = bin.charCodeAt(j);
  return out;
}

/** Base64 data URL for preview overlays (small PNGs only). */
export function pngBytesToDataUrl(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return `data:image/png;base64,${btoa(binary)}`;
}

/** Overlay style: pdf-lib bottom-left image box → CSS absolute within page-sized box. */
export function imageStampOverlayStyle(
  stamp: Pick<ImageStamp, "pdfX" | "pdfY" | "pdfW" | "pdfH">,
  pdfPageW: number,
  pdfPageH: number,
): CSSProperties {
  const leftPct = (stamp.pdfX / pdfPageW) * 100;
  const topPct = ((pdfPageH - stamp.pdfY - stamp.pdfH) / pdfPageH) * 100;
  const widthPct = (stamp.pdfW / pdfPageW) * 100;
  const heightPct = (stamp.pdfH / pdfPageH) * 100;
  return {
    position: "absolute",
    left: `${leftPct}%`,
    top: `${topPct}%`,
    width: `${widthPct}%`,
    height: `${heightPct}%`,
    pointerEvents: "none",
  };
}

export function textStampOverlayStyle(
  stamp: Pick<TextStamp, "pdfX" | "pdfY" | "fontSize">,
  pdfPageW: number,
  pdfPageH: number,
): CSSProperties {
  const lineHFrac = (stamp.fontSize * 1.35) / pdfPageH;
  const baselineFromTopFrac = (pdfPageH - stamp.pdfY) / pdfPageH;
  const topFrac = Math.max(0, baselineFromTopFrac - lineHFrac);
  const leftPct = (stamp.pdfX / pdfPageW) * 100;
  return {
    position: "absolute",
    left: `${leftPct}%`,
    top: `${topFrac * 100}%`,
    transform: "translateY(-50%)",
    maxWidth: "85%",
    fontSize: `clamp(10px, ${(stamp.fontSize / pdfPageW) * 560}px, 22px)`,
    fontWeight: 600,
    color: "#0f172a",
    lineHeight: 1.15,
    pointerEvents: "none",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  };
}

/** pdf-lib uses bottom-left origin; click is top-left relative to rendered page. */
export function clickToImageStampPdfBox(opts: {
  clickLocalX: number;
  clickLocalY: number;
  displayW: number;
  displayH: number;
  pdfPageW: number;
  pdfPageH: number;
  stampPdfW: number;
  stampPdfH: number;
}): { pdfX: number; pdfY: number } {
  const { clickLocalX, clickLocalY, displayW, displayH, pdfPageW, pdfPageH, stampPdfW, stampPdfH } = opts;
  const relX = clickLocalX / Math.max(1, displayW);
  const relY = clickLocalY / Math.max(1, displayH);
  const centerPdfX = relX * pdfPageW;
  const centerPdfYFromBottom = pdfPageH - relY * pdfPageH;
  return {
    pdfX: centerPdfX - stampPdfW / 2,
    pdfY: centerPdfYFromBottom - stampPdfH / 2,
  };
}

/** Baseline X/Y from bottom for drawText (Y is baseline). */
export function clickToTextBaselinePdf(opts: {
  clickLocalX: number;
  clickLocalY: number;
  displayW: number;
  displayH: number;
  pdfPageW: number;
  pdfPageH: number;
  fontSize: number;
}): { pdfX: number; pdfY: number } {
  const { clickLocalX, clickLocalY, displayW, displayH, pdfPageW, pdfPageH, fontSize } = opts;
  const relX = clickLocalX / Math.max(1, displayW);
  const relY = clickLocalY / Math.max(1, displayH);
  const centerPdfYFromBottom = pdfPageH - relY * pdfPageH;
  return {
    pdfX: Math.max(8, relX * pdfPageW),
    pdfY: centerPdfYFromBottom - fontSize * 0.25,
  };
}
