import type { Metadata } from "next";

import { ImageToPdfTool } from "@/components/tools/image-to-pdf-tool";

export const metadata: Metadata = {
  title: "Image to PDF Converter — JPG & PNG to One PDF",
  description:
    "Combine multiple JPG or PNG images into a single PDF in your browser. Reorder pages, pick A4/Letter/custom sizes, and download instantly.",
};

export default function ImageToPdfPage() {
  return <ImageToPdfTool />;
}
