import UTIF from "utif";

const MAX_EDGE = 8192;
const HEIC_HINT = /\.(heic|heif)$/i;
const TIFF_HINT = /\.(tif|tiff)$/i;

function looksHeic(file: File): boolean {
  return HEIC_HINT.test(file.name) || /image\/hei(c|f)/i.test(file.type);
}

function looksTiff(file: File): boolean {
  return TIFF_HINT.test(file.name) || file.type === "image/tiff";
}

function scaleCanvas(src: HTMLCanvasElement, maxEdge: number): HTMLCanvasElement {
  const { width: w, height: h } = src;
  const m = Math.max(w, h);
  if (m <= maxEdge) return src;
  const r = maxEdge / m;
  const nw = Math.max(1, Math.round(w * r));
  const nh = Math.max(1, Math.round(h * r));
  const out = document.createElement("canvas");
  out.width = nw;
  out.height = nh;
  const ctx = out.getContext("2d");
  if (!ctx) return src;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, 0, 0, nw, nh);
  return out;
}

async function decodeHeicToCanvas(file: File): Promise<HTMLCanvasElement> {
  const { default: heic2any } = await import("heic2any");
  const out = await heic2any({ blob: file, toType: "image/png", quality: 0.92 });
  const blob = Array.isArray(out) ? out[0] : out;
  if (!blob) throw new Error("HEIC decode returned no image.");
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadHtmlImage(url);
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available.");
    ctx.drawImage(img, 0, 0);
    return scaleCanvas(c, MAX_EDGE);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image."));
    img.src = src;
  });
}

async function decodeTiffToCanvas(file: File): Promise<HTMLCanvasElement> {
  const buffer = await file.arrayBuffer();
  const ifds = UTIF.decode(buffer);
  if (!ifds[0]) throw new Error("TIFF has no readable frames.");
  const ifd = ifds[0];
  UTIF.decodeImage(buffer, ifd);
  const w = ifd.width;
  const h = ifd.height;
  if (!w || !h) throw new Error("TIFF is missing dimensions.");
  const rgba = UTIF.toRGBA8(ifd);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available.");
  const copy = new Uint8ClampedArray(rgba);
  const id = new ImageData(copy, w, h);
  ctx.putImageData(id, 0, 0);
  return scaleCanvas(canvas, MAX_EDGE);
}

async function decodeBitmapLikeToCanvas(file: File): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(file);
  try {
    const bmp = await createImageBitmap(file);
    const c = document.createElement("canvas");
    c.width = bmp.width;
    c.height = bmp.height;
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available.");
    ctx.drawImage(bmp, 0, 0);
    bmp.close();
    return scaleCanvas(c, MAX_EDGE);
  } catch {
    const img = await loadHtmlImage(url);
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available.");
    ctx.drawImage(img, 0, 0);
    return scaleCanvas(c, MAX_EDGE);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export type DecodedCanvas = {
  canvas: HTMLCanvasElement;
  /** Best-effort label for UI */
  sourceKind: string;
};

export async function decodeFileToCanvas(file: File): Promise<DecodedCanvas> {
  if (looksHeic(file)) {
    const canvas = await decodeHeicToCanvas(file);
    return { canvas, sourceKind: "HEIC / HEIF" };
  }
  if (looksTiff(file)) {
    try {
      const canvas = await decodeTiffToCanvas(file);
      return { canvas, sourceKind: "TIFF" };
    } catch {
      /* fall through */
    }
  }

  try {
    const canvas = await decodeBitmapLikeToCanvas(file);
    const kind = file.type.includes("svg") ? "SVG" : file.type.replace("image/", "").toUpperCase() || "Image";
    return { canvas, sourceKind: kind };
  } catch {
    /* try TIFF without extension */
  }

  try {
    const canvas = await decodeTiffToCanvas(file);
    return { canvas, sourceKind: "TIFF" };
  } catch {
    /* try HEIC without extension */
  }

  if (!looksHeic(file)) {
    try {
      const canvas = await decodeHeicToCanvas(file);
      return { canvas, sourceKind: "HEIC / HEIF" };
    } catch {
      /* final throw below */
    }
  }

  throw new Error("Could not decode this image. Try PNG, JPG, WebP, or TIFF.");
}
