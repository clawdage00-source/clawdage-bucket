import { ToolJsonLd } from "@/components/JsonLd";
import { SignatureMakerTool } from "@/components/tools/signature-maker-tool";
import { buildToolMetadata } from "@/lib/seo/build-tool-metadata";

export async function generateMetadata() {
  return buildToolMetadata("signature-maker");
}

export default function SignatureMakerPage() {
  return (
    <>
      <ToolJsonLd slug="signature-maker" />
      <SignatureMakerTool />
    </>
  );
}
