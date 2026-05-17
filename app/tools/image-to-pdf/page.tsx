import { ToolJsonLd } from "@/components/JsonLd";
import { ImageToPdfTool } from "@/components/tools/image-to-pdf-tool";
import { buildToolMetadata } from "@/lib/seo/build-tool-metadata";

export async function generateMetadata() {
  return buildToolMetadata("image-to-pdf");
}

export default function ImageToPdfPage() {
  return (
    <>
      <ToolJsonLd slug="image-to-pdf" />
      <ImageToPdfTool />
    </>
  );
}
