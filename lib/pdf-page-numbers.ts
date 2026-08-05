import { PDFDocument, StandardFonts, grayscale, rgb } from "pdf-lib";

export type PageNumberPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type PageNumberFormat = "number" | "page-number" | "number-of-total";
export type PageNumberColor = "black" | "gray" | "blue";

export type PageNumberOptions = {
  position: PageNumberPosition;
  format: PageNumberFormat;
  color: PageNumberColor;
  fontSize: number;
  margin: number;
  startPage: number;
  startNumber: number;
};

export function formatPageNumber(
  number: number,
  finalNumber: number,
  format: PageNumberFormat,
): string {
  if (format === "page-number") return `Page ${number}`;
  if (format === "number-of-total") return `${number} of ${finalNumber}`;
  return String(number);
}

function resolveColor(color: PageNumberColor) {
  if (color === "gray") return grayscale(0.4);
  if (color === "blue") return rgb(0.15, 0.35, 0.75);
  return grayscale(0.08);
}

export async function addPageNumbers(
  bytes: Uint8Array,
  options: PageNumberOptions,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(bytes);
  const pages = pdf.getPages();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const startPage = Math.max(1, Math.min(Math.floor(options.startPage), pages.length));
  const startNumber = Math.max(0, Math.floor(options.startNumber));
  const fontSize = Math.max(6, Math.min(options.fontSize, 72));
  const margin = Math.max(0, options.margin);
  const finalNumber = startNumber + (pages.length - startPage);

  pages.forEach((page, pageIndex) => {
    const pageNumber = pageIndex + 1;
    if (pageNumber < startPage) return;

    const number = startNumber + (pageNumber - startPage);
    const text = formatPageNumber(number, finalNumber, options.format);
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const { width, height } = page.getSize();
    const isRight = options.position.endsWith("right");
    const isCenter = options.position.endsWith("center");
    const isTop = options.position.startsWith("top");
    const x = isCenter
      ? Math.max(0, (width - textWidth) / 2)
      : isRight
        ? Math.max(0, width - margin - textWidth)
        : margin;
    const y = isTop
      ? Math.max(0, height - margin - fontSize)
      : margin;

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: resolveColor(options.color),
    });
  });

  return pdf.save({ useObjectStreams: false });
}

export function pageNumberErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/password|encrypted/i.test(message)) {
    return "This PDF is password-protected. Unlock it first, then add page numbers.";
  }
  return message || "Could not add page numbers to this PDF.";
}
