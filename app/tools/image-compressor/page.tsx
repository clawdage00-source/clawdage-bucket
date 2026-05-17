import { ToolJsonLd } from "@/components/JsonLd";
import { ImageCompressorTool } from "@/components/tools/image-compressor-tool";
import { getProfilePlanSnapshot, userHasActivePaidPlan } from "@/lib/get-profile-plan";
import { buildToolMetadata } from "@/lib/seo/build-tool-metadata";

export async function generateMetadata() {
  return buildToolMetadata("image-compressor");
}

export default async function ImageCompressorPage() {
  const snapshot = await getProfilePlanSnapshot();
  const canBulk = userHasActivePaidPlan(snapshot);

  return (
    <>
      <ToolJsonLd slug="image-compressor" />
      <ImageCompressorTool canBulk={canBulk} />
    </>
  );
}
