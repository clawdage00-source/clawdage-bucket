export type SignatureStyle = "cursive" | "formal" | "bold" | "handwritten";

const STYLE_FONTS: Record<SignatureStyle, string> = {
  cursive: 'italic 52px "Brush Script MT", "Segoe Script", "Apple Chancery", cursive',
  formal: '48px "Times New Roman", Georgia, serif',
  bold: 'bold 44px "Arial Black", "Helvetica Neue", sans-serif',
  handwritten: '42px "Comic Sans MS", "Segoe Print", "Bradley Hand", cursive',
};

export function renderTypedSignature(
  name: string,
  style: SignatureStyle,
  color = "#0f172a",
): string {
  const w = 520;
  const h = 160;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) return "";
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = color;
  ctx.font = STYLE_FONTS[style];
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name.trim() || "Signature", w / 2, h / 2, w - 32);
  return c.toDataURL("image/png");
}

/** Trim empty pixels and export transparent PNG from a canvas data URL. */
export async function transparentPngFromDataUrl(dataUrl: string): Promise<Blob> {
  const img = await loadImage(dataUrl);
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height);
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const a = data[i + 3] ?? 0;
      if (a > 8) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (maxX <= minX || maxY <= minY) {
    return canvasToBlob(c);
  }
  const pad = 12;
  const cw = maxX - minX + 1 + pad * 2;
  const ch = maxY - minY + 1 + pad * 2;
  const out = document.createElement("canvas");
  out.width = cw;
  out.height = ch;
  const octx = out.getContext("2d");
  if (!octx) throw new Error("Canvas not supported");
  octx.clearRect(0, 0, cw, ch);
  octx.drawImage(c, minX, minY, maxX - minX + 1, maxY - minY + 1, pad, pad, maxX - minX + 1, maxY - minY + 1);
  return canvasToBlob(out);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error("Could not read image"));
    im.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Export failed"))), "image/png");
  });
}

export function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const i = dataUrl.indexOf(",");
  const b64 = i >= 0 ? dataUrl.slice(i + 1) : dataUrl;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let j = 0; j < bin.length; j += 1) out[j] = bin.charCodeAt(j);
  return out;
}
