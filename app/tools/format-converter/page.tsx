import type { Metadata } from "next";

import { FormatConverterTool } from "@/components/tools/format-converter-tool";

export const metadata: Metadata = {
  title: "Image Format Converter — PNG, JPG, WebP, AVIF & More",
  description:
    "Convert images between PNG, JPEG, WebP, GIF, AVIF, TIFF, BMP, and SVG in your browser with live preview, quality controls, and clipboard copy.",
};

export default function FormatConverterPage() {
  return <FormatConverterTool />;
}
