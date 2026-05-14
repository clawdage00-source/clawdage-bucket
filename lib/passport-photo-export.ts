import type { Crop } from "react-image-crop";
import { convertToPixelCrop } from "react-image-crop";

/** Pixel rectangle on the **natural** image (full-resolution) used for canvas crop. */
export type CropPixelRect = { x: number; y: number; width: number; height: number };

/** Convert `react-image-crop` crop (relative to displayed `img` size) to natural image pixels. */
export function cropDisplayToNatural(crop: Crop, img: HTMLImageElement): CropPixelRect {
  const pixel = convertToPixelCrop(crop, img.width, img.height);
  const sx = img.naturalWidth / Math.max(1, img.width);
  const sy = img.naturalHeight / Math.max(1, img.height);
  return {
    x: Math.round(pixel.x * sx),
    y: Math.round(pixel.y * sy),
    width: Math.round(pixel.width * sx),
    height: Math.round(pixel.height * sy),
  };
}

/** Passport photo width / height (India-style 3.5×4.5 cm). */
export const PASSPORT_ASPECT = 3.5 / 4.5;

export const EXPORT_DPI = 300;

/** Print size at 300 DPI (3.5 cm × 4.5 cm). */
export const PASSPORT_W_PX = Math.round((3.5 / 2.54) * EXPORT_DPI);
export const PASSPORT_H_PX = Math.round((4.5 / 2.54) * EXPORT_DPI);

/** 4"×6" portrait @ 300 DPI, 8 slots (2×4). */
export const SHEET_4x6 = {
  paperW: Math.round(4 * EXPORT_DPI),
  paperH: Math.round(6 * EXPORT_DPI),
  cols: 2,
  rows: 4,
  count: 8 as const,
};

/** A4 @ 300 DPI (~8.27"×11.69"), 16 slots (4×4). */
export const SHEET_A4 = {
  paperW: Math.round(8.27 * EXPORT_DPI),
  paperH: Math.round(11.69 * EXPORT_DPI),
  cols: 4,
  rows: 4,
  count: 16 as const,
};

export type BgKey = "white" | "lightBlue" | "lightGray";

export const BG_COLORS: Record<BgKey, { r: number; g: number; b: number; label: string }> = {
  white: { r: 255, g: 255, b: 255, label: "White" },
  lightBlue: { r: 232, g: 244, b: 252, label: "Light blue" },
  lightGray: { r: 236, g: 236, b: 237, label: "Light gray" },
};

export function computeCellLayout(
  paperW: number,
  paperH: number,
  cols: number,
  rows: number,
  aspectW: number,
  aspectH: number,
  gutter: number,
): { cellW: number; cellH: number } {
  const innerW = paperW - (cols + 1) * gutter;
  const innerH = paperH - (rows + 1) * gutter;
  const maxCellW = innerW / cols;
  const maxCellH = innerH / rows;
  const ar = aspectW / aspectH;
  let cellW = maxCellW;
  let cellH = cellW / ar;
  if (cellH > maxCellH) {
    cellH = maxCellH;
    cellW = cellH * ar;
  }
  return { cellW: Math.floor(cellW), cellH: Math.floor(cellH) };
}

export async function loadImageToBitmap(src: string): Promise<ImageBitmap> {
  const res = await fetch(src);
  const blob = await res.blob();
  return createImageBitmap(blob);
}

/** Crops the source image to the pixel rect in **natural** image coordinates. */
export async function canvasFromImageCrop(imageSrc: string, area: CropPixelRect): Promise<HTMLCanvasElement> {
  const bmp = await loadImageToBitmap(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = area.width;
  canvas.height = area.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bmp.close();
    throw new Error("Canvas not supported");
  }
  ctx.drawImage(bmp, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);
  bmp.close();
  return canvas;
}

/** Scales cropped RGBA onto solid background at exact passport pixel size (cover). */
export function paintPassportOnBackground(
  cropCanvas: HTMLCanvasElement,
  bg: { r: number; g: number; b: number },
  outW: number,
  outH: number,
): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = outW;
  out.height = outH;
  const ctx = out.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.fillStyle = `rgb(${bg.r},${bg.g},${bg.b})`;
  ctx.fillRect(0, 0, outW, outH);
  const scale = Math.max(outW / cropCanvas.width, outH / cropCanvas.height);
  const dw = cropCanvas.width * scale;
  const dh = cropCanvas.height * scale;
  const ox = (outW - dw) / 2;
  const oy = (outH - dh) / 2;
  ctx.drawImage(cropCanvas, ox, oy, dw, dh);
  return out;
}

export function drawDiagonalWatermark(ctx: CanvasRenderingContext2D, w: number, h: number, text = "Clawdage") {
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.PI / 5.5);
  const fontSize = Math.max(18, Math.min(56, w / 10));
  ctx.font = `600 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillStyle = "rgba(15, 23, 42, 0.14)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 0, 0);
  ctx.restore();
  ctx.save();
  ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
  ctx.fillStyle = "rgba(15, 23, 42, 0.35)";
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText("Clawdage — Free export", w - 12, h - 8);
  ctx.restore();
}

export function tilePassportOntoSheet(
  passportTile: HTMLCanvasElement,
  paperW: number,
  paperH: number,
  cols: number,
  rows: number,
  gutter: number,
): HTMLCanvasElement {
  const { cellW, cellH } = computeCellLayout(paperW, paperH, cols, rows, 3.5, 4.5, gutter);
  const sheet = document.createElement("canvas");
  sheet.width = paperW;
  sheet.height = paperH;
  const ctx = sheet.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, paperW, paperH);

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = gutter + col * (cellW + gutter);
      const y = gutter + row * (cellH + gutter);
      const sc = Math.max(cellW / passportTile.width, cellH / passportTile.height);
      const dw = passportTile.width * sc;
      const dh = passportTile.height * sc;
      const ox = x + (cellW - dw) / 2;
      const oy = y + (cellH - dh) / 2;
      ctx.strokeStyle = "rgba(0,0,0,0.06)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, cellW - 1, cellH - 1);
      ctx.drawImage(passportTile, ox, oy, dw, dh);
    }
  }
  return sheet;
}

export function canvasToJpegBlob(canvas: HTMLCanvasElement, quality = 0.95): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/jpeg", quality);
  });
}

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/png");
  });
}

/** PDF page size in pt for a raster at EXPORT_DPI. */
export function pixelsToPdfPt(px: number): number {
  return (px / EXPORT_DPI) * 72;
}
