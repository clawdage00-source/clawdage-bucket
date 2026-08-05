import { PdfPageNumbersToolLazy } from "@/app/tools/pdf-page-numbers/pdf-page-numbers-tool-loader";
import { ToolJsonLd } from "@/components/JsonLd";
import { buildToolMetadata } from "@/lib/seo/build-tool-metadata";

export async function generateMetadata() {
  return buildToolMetadata("pdf-page-numbers");
}

export default function PdfPageNumbersPage() {
  return (
    <>
      <ToolJsonLd slug="pdf-page-numbers" />
      <PdfPageNumbersToolLazy />
    </>
  );
}
