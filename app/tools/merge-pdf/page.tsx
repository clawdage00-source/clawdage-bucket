import { ToolJsonLd } from "@/components/JsonLd";
import { ToolSeoContent } from "@/components/tool-seo-content";
import { MergePdfTool } from "@/components/tools/merge-pdf-tool";
import { buildToolMetadata } from "@/lib/seo/build-tool-metadata";

export async function generateMetadata() {
  return buildToolMetadata("merge-pdf");
}

export default function MergePdfPage() {
  return (
    <>
      <ToolJsonLd slug="merge-pdf" />
      <MergePdfTool />
      <ToolSeoContent slug="merge-pdf" />
    </>
  );
}
