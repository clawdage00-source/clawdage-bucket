import { ToolJsonLd } from "@/components/JsonLd";
import { WhatsAppLinkTool } from "@/components/tools/whatsapp-link-tool";
import { buildToolMetadata } from "@/lib/seo/build-tool-metadata";

export async function generateMetadata() {
  return buildToolMetadata("whatsapp-link");
}

export default function WhatsAppLinkPage() {
  return (
    <>
      <ToolJsonLd slug="whatsapp-link" />
      <WhatsAppLinkTool />
    </>
  );
}
