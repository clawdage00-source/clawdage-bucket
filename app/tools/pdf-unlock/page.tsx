import { ToolJsonLd } from "@/components/JsonLd";
import { PdfUnlockToolLazy } from "@/app/tools/pdf-unlock/pdf-unlock-tool-loader";
import { buildToolMetadata } from "@/lib/seo/build-tool-metadata";

export async function generateMetadata() {
  return buildToolMetadata("pdf-unlock");
}

export default function PdfUnlockPage() {
  return (
    <>
      <ToolJsonLd slug="pdf-unlock" />
      <PdfUnlockToolLazy />
    </>
  );
}
