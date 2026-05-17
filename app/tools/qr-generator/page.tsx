import { ToolJsonLd } from "@/components/JsonLd";
import { QrGeneratorTool } from "@/components/tools/qr-generator-tool";
import { getProfilePlanSnapshot, userHasActivePaidPlan } from "@/lib/get-profile-plan";
import { buildToolMetadata } from "@/lib/seo/build-tool-metadata";

export async function generateMetadata() {
  return buildToolMetadata("qr-generator");
}

export default async function QrGeneratorPage() {
  const snapshot = await getProfilePlanSnapshot();
  const isPro = userHasActivePaidPlan(snapshot);

  return (
    <>
      <ToolJsonLd slug="qr-generator" />
      <QrGeneratorTool isPro={isPro} />
    </>
  );
}
