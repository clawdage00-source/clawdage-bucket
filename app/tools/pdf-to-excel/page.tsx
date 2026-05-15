import { ToolJsonLd } from "@/components/JsonLd";
import { ToolSeoContent } from "@/components/tool-seo-content";
import { PdfToExcelToolLazy } from "@/app/tools/pdf-to-excel/pdf-to-excel-tool-loader";
import { buildToolMetadata } from "@/lib/seo/build-tool-metadata";

export async function generateMetadata() {
  return buildToolMetadata("pdf-to-excel");
}

export default function PdfToExcelPage() {
  return (
    <>
      <ToolJsonLd slug="pdf-to-excel" />
      <PdfToExcelToolLazy />
      <ToolSeoContent slug="pdf-to-excel" />
    </>
  );
}
