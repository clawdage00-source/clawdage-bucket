import { ToolJsonLd } from "@/components/JsonLd";
import { FormatConverterTool } from "@/components/tools/format-converter-tool";
import { buildToolMetadata } from "@/lib/seo/build-tool-metadata";

export async function generateMetadata() {
  return buildToolMetadata("format-converter");
}

export default function FormatConverterPage() {
  return (
    <>
      <ToolJsonLd slug="format-converter" />
      <FormatConverterTool />
    </>
  );
}
