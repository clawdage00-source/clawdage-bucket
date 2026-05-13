/**
 * Static PNGs in `public/tools-icon/` for tool grid cards (slug → public URL).
 * Tools without an entry keep the Lucide fallback in `ToolGrid`.
 */
export const TOOL_CARD_ICON_BY_SLUG: Record<string, string> = {
  "merge-pdf": "/tools-icon/pdf-merge.png",
  "compress-pdf": "/tools-icon/pdf-compressor.png",
  "image-to-pdf": "/tools-icon/image-to-pdf.png",
  "ai-background-remover": "/tools-icon/background-remover.png",
  "image-compressor": "/tools-icon/image-compressor.png",
  "passport-photo-maker": "/tools-icon/passport-photo-maker.png",
  "id-resizer": "/tools-icon/aadhar-pancard-resizer.png",
  "qr-generator": "/tools-icon/qrcode-generator.png",
  "ocr": "/tools-icon/image-to-text.png",
  "image-to-text-ocr": "/tools-icon/image-to-text.png",
};

export function getToolCardIconSrc(slug: string): string | undefined {
  return TOOL_CARD_ICON_BY_SLUG[slug];
}
