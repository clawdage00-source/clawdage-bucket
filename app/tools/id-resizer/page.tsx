import { ToolJsonLd } from "@/components/JsonLd";
import { IdResizerTool } from "@/components/tools/id-resizer-tool";
import { getProfilePlanSnapshot, userHasActivePaidPlan } from "@/lib/get-profile-plan";
import { buildToolMetadata } from "@/lib/seo/build-tool-metadata";

export async function generateMetadata() {
  return buildToolMetadata("id-resizer");
}

export default async function IdResizerPage() {
  const snapshot = await getProfilePlanSnapshot();
  const isPro = userHasActivePaidPlan(snapshot);

  return (
    <>
      <ToolJsonLd slug="id-resizer" />
      <IdResizerTool isPro={isPro} />
    </>
  );
}
