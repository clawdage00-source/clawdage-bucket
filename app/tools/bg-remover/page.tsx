import { ToolJsonLd } from "@/components/JsonLd";
import { ToolSeoContent } from "@/components/tool-seo-content";
import { getBgRemoverEligibility } from "@/actions/bg-remover-usage";
import { BgRemoverToolLazy } from "@/app/tools/bg-remover/bg-remover-tool-loader";
import { buildToolMetadata } from "@/lib/seo/build-tool-metadata";

export async function generateMetadata() {
  return buildToolMetadata("bg-remover");
}

export default async function BgRemoverPage() {
  const initialEligibility = await getBgRemoverEligibility();

  return (
    <>
      <ToolJsonLd slug="bg-remover" />
      <BgRemoverToolLazy initialEligibility={initialEligibility} />
      <ToolSeoContent slug="bg-remover" />
    </>
  );
}
