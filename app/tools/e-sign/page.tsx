import { ToolJsonLd } from "@/components/JsonLd";
import { ESignToolLazy } from "@/app/tools/e-sign/e-sign-tool-loader";
import { getProfilePlanSnapshot, isFreemodeDevelopment, userHasActivePaidPlan } from "@/lib/get-profile-plan";
import { buildToolMetadata } from "@/lib/seo/build-tool-metadata";

export async function generateMetadata() {
  return buildToolMetadata("e-sign");
}

export default async function ESignPage() {
  const snapshot = await getProfilePlanSnapshot();
  const isPro = userHasActivePaidPlan(snapshot) || isFreemodeDevelopment();

  return (
    <>
      <ToolJsonLd slug="e-sign" />
      <ESignToolLazy isPro={isPro} />
    </>
  );
}
