import { ToolJsonLd } from "@/components/JsonLd";
import { PdfSplitToolLazy } from "@/app/tools/pdf-split/pdf-split-tool-loader";
import { buildToolMetadata } from "@/lib/seo/build-tool-metadata";

export async function generateMetadata() {
  return buildToolMetadata("pdf-split");
}

export default function PdfSplitPage() {
  return (
    <>
      <ToolJsonLd slug="pdf-split" />
      <PdfSplitToolLazy />
    </>
  );
}
