import type { Area } from "react-easy-crop";

import { rotateSize } from "@/lib/id-resizer-crop-fit";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (e) => reject(e));
    img.crossOrigin = "anonymous";
    img.src = src;
  });
}

/**
 * Renders the cropped region into a canvas at exact output dimensions.
 * `pixelCrop` is in the same space as react-easy-crop: rotated bounding box when `rotation !== 0`.
 */
export async function renderCroppedRegion(
  imageSrc: string,
  pixelCrop: Area,
  outputWidth: number,
  outputHeight: number,
  rotation = 0,
): Promise<HTMLCanvasElement> {
  const image = await loadImage(imageSrc);

  if (rotation === 0) {
    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas is not supported");
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      outputWidth,
      outputHeight,
    );
    return canvas;
  }

  const { width: bboxW, height: bboxH } = rotateSize(image.naturalWidth, image.naturalHeight, rotation);
  const full = document.createElement("canvas");
  full.width = Math.max(1, Math.ceil(bboxW));
  full.height = Math.max(1, Math.ceil(bboxH));
  const fctx = full.getContext("2d");
  if (!fctx) {
    throw new Error("Canvas is not supported");
  }
  fctx.imageSmoothingEnabled = true;
  fctx.imageSmoothingQuality = "high";
  fctx.translate(bboxW / 2, bboxH / 2);
  fctx.rotate((rotation * Math.PI) / 180);
  fctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas is not supported");
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    full,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputWidth,
    outputHeight,
  );
  return canvas;
}

export function applyWatermark(canvas: HTMLCanvasElement, text = "FREE PREVIEW"): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width, height } = canvas;
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-Math.PI / 6);
  ctx.font = `${Math.max(14, Math.floor(width / 18))}px system-ui, sans-serif`;
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 0, 0);
  ctx.restore();
  ctx.font = "11px system-ui, sans-serif";
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText("Clawdage", width - 8, height - 6);
}

export async function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/jpeg", quality);
  });
}

/**
 * Reduces JPEG quality, then optionally scales canvas until under maxBytes or limits hit.
 */
export async function compressCanvasToMaxBytes(
  source: HTMLCanvasElement,
  maxBytes: number,
  options?: { minQuality?: number; minScale?: number },
): Promise<{ blob: Blob; canvas: HTMLCanvasElement }> {
  const minQuality = options?.minQuality ?? 0.28;
  const minScale = options?.minScale ?? 0.45;

  let work = source;

  async function tryQualityLoop(c: HTMLCanvasElement): Promise<Blob | null> {
    let q = 0.92;
    while (q >= minQuality) {
      const blob = await canvasToJpegBlob(c, q);
      if (blob && blob.size <= maxBytes) return blob;
      q -= 0.045;
    }
    return canvasToJpegBlob(c, minQuality);
  }

  let blob = await tryQualityLoop(work);
  if (blob && blob.size <= maxBytes) {
    return { blob, canvas: work };
  }

  let scale = 0.92;
  while (scale >= minScale) {
    const w = Math.max(120, Math.round(work.width * scale));
    const h = Math.max(120, Math.round(work.height * scale));
    const scaled = document.createElement("canvas");
    scaled.width = w;
    scaled.height = h;
    const sctx = scaled.getContext("2d");
    if (!sctx) break;
    sctx.imageSmoothingEnabled = true;
    sctx.imageSmoothingQuality = "high";
    sctx.drawImage(work, 0, 0, w, h);
    work = scaled;
    blob = await tryQualityLoop(work);
    if (blob && blob.size <= maxBytes) {
      return { blob, canvas: work };
    }
    scale -= 0.06;
  }

  const fallback = await canvasToJpegBlob(work, minQuality);
  if (!fallback) {
    throw new Error("Could not compress image");
  }
  return { blob: fallback, canvas: work };
}

export async function stitchCanvasesVertical(top: HTMLCanvasElement, bottom: HTMLCanvasElement): Promise<HTMLCanvasElement> {
  const w = Math.max(top.width, bottom.width);
  const h = top.height + bottom.height;
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const ctx = out.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(top, 0, 0, top.width, top.height, 0, 0, w, top.height);
  ctx.drawImage(bottom, 0, top.height, bottom.width, bottom.height, 0, top.height, w, bottom.height);
  return out;
}

export async function stitchCanvasesHorizontal(left: HTMLCanvasElement, right: HTMLCanvasElement): Promise<HTMLCanvasElement> {
  const w = left.width + right.width;
  const h = Math.max(left.height, right.height);
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const ctx = out.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(left, 0, 0);
  ctx.drawImage(right, left.width, 0);
  return out;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
