import { GIFEncoder, applyPalette, quantize } from "gifenc";
import UTIF from "utif";

import { rgbaToBmpBlob } from "./bmp-encode";

export type OutputFormat = "png" | "jpeg" | "webp" | "gif" | "avif" | "tiff" | "bmp" | "svg";

export type EncodeSettings = {
  jpegQuality: number;
  webpQuality: number;
  webpLossless: boolean;
  preserveTransparency: boolean;
  gifColors: number;
  gifDelayMs: number;
  gifTransparency: boolean;
  avifQuality: number;
};

let avifEncodeCached: boolean | null = null;

async function browserSupportsAvifEncode(): Promise<boolean> {
  if (avifEncodeCached !== null) return avifEncodeCached;
  if (typeof document === "undefined") return false;
  const c = document.createElement("canvas");
  c.width = 2;
  c.height = 2;
  const b = await new Promise<Blob | null>((resolve) => {
    c.toBlob((blob) => resolve(blob), "image/avif", 0.5);
  });
  avifEncodeCached = !!(b && b.size > 4);
  return avifEncodeCached;
}

function flattenCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = canvas.width;
  c.height = canvas.height;
  const ctx = c.getContext("2d");
  if (!ctx) return canvas;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(canvas, 0, 0);
  return c;
}

function pickWorkCanvas(
  canvas: HTMLCanvasElement,
  format: OutputFormat,
  settings: EncodeSettings,
): HTMLCanvasElement {
  if (format === "jpeg") {
    return flattenCanvas(canvas);
  }
  if (!settings.preserveTransparency && (format === "png" || format === "webp" || format === "gif")) {
    return flattenCanvas(canvas);
  }
  if (format === "bmp" || format === "tiff") {
    return flattenCanvas(canvas);
  }
  if (format === "svg") {
    return settings.preserveTransparency ? canvas : flattenCanvas(canvas);
  }
  if (format === "avif" && !settings.preserveTransparency) {
    return flattenCanvas(canvas);
  }
  return canvas;
}

function blobFromCanvas(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error("Encoding failed."));
      },
      type,
      ...(quality === undefined ? [] : [quality]),
    );
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Could not read file."));
    r.readAsDataURL(blob);
  });
}

function encodeGif(imageData: ImageData, settings: EncodeSettings): Blob {
  const { data, width, height } = imageData;
  const maxColors = Math.min(256, Math.max(2, Math.round(settings.gifColors)));
  const qOpts = settings.gifTransparency
    ? ({ format: "rgba4444" as const, oneBitAlpha: true } as const)
    : ({ format: "rgb565" as const } as const);
  const palette = quantize(data, maxColors, qOpts);
  const index = applyPalette(data, palette, qOpts.format);
  const gif = GIFEncoder();
  gif.writeFrame(index, width, height, {
    palette,
    delay: Math.max(0, Math.round(settings.gifDelayMs)),
    ...(settings.gifTransparency ? { transparent: true, transparentIndex: 0 } : {}),
  });
  gif.finish();
  const raw = gif.bytes();
  return new Blob([new Uint8Array(raw)], { type: "image/gif" });
}

export async function encodeCanvasToBlob(
  canvas: HTMLCanvasElement,
  format: OutputFormat,
  settings: EncodeSettings,
): Promise<Blob> {
  const work = pickWorkCanvas(canvas, format, settings);
  const ctx = work.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available.");
  const imageData = ctx.getImageData(0, 0, work.width, work.height);

  switch (format) {
    case "png":
      return blobFromCanvas(work, "image/png");
    case "jpeg":
      return blobFromCanvas(work, "image/jpeg", settings.jpegQuality / 100);
    case "webp": {
      if (settings.webpLossless) {
        return blobFromCanvas(work, "image/webp", 1);
      }
      return blobFromCanvas(work, "image/webp", settings.webpQuality / 100);
    }
    case "gif":
      return encodeGif(imageData, settings);
    case "avif": {
      const ok = await browserSupportsAvifEncode();
      if (!ok) {
        throw new Error("AVIF export is not supported in this browser (try Chrome, or pick WebP).");
      }
      return blobFromCanvas(work, "image/avif", settings.avifQuality / 100);
    }
    case "tiff": {
      const buf = UTIF.encodeImage(imageData.data, work.width, work.height);
      return new Blob([buf], { type: "image/tiff" });
    }
    case "bmp":
      return rgbaToBmpBlob(imageData.data, work.width, work.height);
    case "svg": {
      const png = await blobFromCanvas(work, "image/png", 0.92);
      const dataUrl = await blobToDataUrl(png);
      const w = work.width;
      const h = work.height;
      const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">\n  <image width="100%" height="100%" href="${dataUrl}" preserveAspectRatio="xMidYMid meet" />\n</svg>\n`;
      return new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    }
    default:
      throw new Error("Unsupported output format.");
  }
}

export function getOutputMime(format: OutputFormat): string {
  switch (format) {
    case "png":
      return "image/png";
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "avif":
      return "image/avif";
    case "tiff":
      return "image/tiff";
    case "bmp":
      return "image/bmp";
    case "svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

export function defaultFilenameStem(originalName: string): string {
  return originalName.replace(/\.[^.]+$/, "") || "converted";
}

export function extensionForFormat(format: OutputFormat): string {
  switch (format) {
    case "jpeg":
      return "jpg";
    case "svg":
      return "svg";
    default:
      return format;
  }
}
