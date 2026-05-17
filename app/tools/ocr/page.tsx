import { ToolJsonLd } from "@/components/JsonLd";
import { OcrToolLazy } from "@/app/tools/ocr/ocr-tool-loader";
import { getProfilePlanSnapshot, userHasActivePaidPlan } from "@/lib/get-profile-plan";
import { buildToolMetadata } from "@/lib/seo/build-tool-metadata";

export async function generateMetadata() {
  return buildToolMetadata("ocr");
}

export default async function OcrPage() {
  const snapshot = await getProfilePlanSnapshot();
  const isPro = userHasActivePaidPlan(snapshot);

  return (
    <>
      <ToolJsonLd slug="ocr" />
      <OcrToolLazy isPro={isPro} />
    </>
  );
}
