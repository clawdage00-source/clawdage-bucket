import { ToolJsonLd } from "@/components/JsonLd";
import { InvoiceGeneratorTool } from "@/components/tools/invoice-generator-tool";
import { buildToolMetadata } from "@/lib/seo/build-tool-metadata";

export async function generateMetadata() {
  return buildToolMetadata("invoice-generator");
}

export default function InvoiceGeneratorPage() {
  return (
    <>
      <ToolJsonLd slug="invoice-generator" />
      <InvoiceGeneratorTool />
    </>
  );
}
