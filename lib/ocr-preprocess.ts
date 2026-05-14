export type OcrPreprocessOptions = {
  /** Convert to luminance (recommended for OCR cleanup). */
  grayscale: boolean;
  /** Additive offset on luminance, roughly −80…80. */
  brightness: number;
  /** Contrast multiplier around mid-gray, roughly 0.6…1.8 (1 = neutral). */
  contrast: number;
  /** Otsu binarization (foreground ink vs background). */
  binarize: boolean;
  /** Longest edge cap to keep canvas work reasonable. */
  maxEdge?: number;
};

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function otsuThreshold(histogram: Uint32Array, pixelCount: number): number {
  let sum = 0;
  for (let i = 0; i < 256; i += 1) sum += i * histogram[i]!;
  let sumB = 0;
  let wB = 0;
  let wF = 0;
  let varMax = 0;
  let threshold = 0;

  for (let t = 0; t < 256; t += 1) {
    wB += histogram[t]!;
    if (wB === 0) continue;
    wF = pixelCount - wB;
    if (wF === 0) break;
    sumB += t * histogram[t]!;
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > varMax) {
      varMax = between;
      threshold = t;
    }
  }
  return threshold;
}

/**
 * Canvas pipeline: luminance (optional color), brightness/contrast, optional Otsu binarization.
 * Returns a PNG blob suitable for Tesseract / TrOCR.
 */
export async function preprocessImageToPngBlob(file: File, opts: OcrPreprocessOptions): Promise<Blob> {
  const maxEdge = opts.maxEdge ?? 2400;
  const bitmap = await createImageBitmap(file);
  let w = bitmap.width;
  let h = bitmap.height;
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  w = Math.round(w * scale);
  h = Math.round(h * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D context not available");

  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  const n = w * h;
  const gray = new Float32Array(n);

  for (let i = 0, p = 0; i < n; i += 1, p += 4) {
    const r = d[p]!;
    const g = d[p + 1]!;
    const b = d[p + 2]!;
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }

  const br = clamp(opts.brightness, -90, 90);
  const c = clamp(opts.contrast, 0.45, 2.05);

  for (let i = 0; i < n; i += 1) {
    const v = (gray[i]! + br - 128) * c + 128;
    gray[i] = clamp(v, 0, 255);
  }

  if (opts.binarize) {
    const hist = new Uint32Array(256);
    for (let i = 0; i < n; i += 1) {
      const bin = Math.min(255, Math.max(0, Math.round(gray[i]!)));
      hist[bin] = (hist[bin] ?? 0) + 1;
    }
    const t = otsuThreshold(hist, n);
    for (let i = 0, p = 0; i < n; i += 1, p += 4) {
      const out = gray[i]! <= t ? 0 : 255;
      d[p] = out;
      d[p + 1] = out;
      d[p + 2] = out;
    }
  } else if (opts.grayscale) {
    for (let i = 0, p = 0; i < n; i += 1, p += 4) {
      const v = Math.round(gray[i]!);
      d[p] = v;
      d[p + 1] = v;
      d[p + 2] = v;
    }
  } else {
    for (let i = 0, p = 0; i < n; i += 1, p += 4) {
      const r = d[p]!;
      const g = d[p + 1]!;
      const b = d[p + 2]!;
      const apply = (channel: number) => clamp((channel + br - 128) * c + 128, 0, 255);
      d[p] = apply(r);
      d[p + 1] = apply(g);
      d[p + 2] = apply(b);
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/png", 1));
  if (!blob) throw new Error("Could not encode processed image");
  return blob;
}

export function preprocessBlobToFile(blob: Blob, baseName: string): File {
  const safe = baseName.replace(/[^\w.\-]+/g, "_");
  const stripped = safe.replace(/\.[^.]+$/, "");
  const base = stripped.length > 0 ? stripped : "image";
  return new File([blob], `${base}-ocr.png`, { type: "image/png" });
}
