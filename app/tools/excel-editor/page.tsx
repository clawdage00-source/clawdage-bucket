import { ToolJsonLd } from "@/components/JsonLd";
import { ToolSeoContent } from "@/components/tool-seo-content";
import { ExcelEditorToolLazy } from "@/app/tools/excel-editor/excel-editor-tool-loader";
import { buildToolMetadata } from "@/lib/seo/build-tool-metadata";

export async function generateMetadata() {
  return buildToolMetadata("excel-editor");
}

export default function ExcelEditorPage() {
  return (
    <>
      <ToolJsonLd slug="excel-editor" />
      <ExcelEditorToolLazy />
      <ToolSeoContent slug="excel-editor" />
    </>
  );
}
