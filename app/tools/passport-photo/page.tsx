import { ToolJsonLd } from "@/components/JsonLd";
import { ToolSeoContent } from "@/components/tool-seo-content";
import { PassportPhotoToolLazy } from "@/app/tools/passport-photo/passport-photo-tool-loader";
import { getProfilePlanSnapshot, userHasActivePaidPlan } from "@/lib/get-profile-plan";
import { buildToolMetadata } from "@/lib/seo/build-tool-metadata";

export async function generateMetadata() {
  return buildToolMetadata("passport-photo");
}

export default async function PassportPhotoPage() {
  const snapshot = await getProfilePlanSnapshot();
  const isPro = userHasActivePaidPlan(snapshot);

  return (
    <>
      <ToolJsonLd slug="passport-photo" />
      <PassportPhotoToolLazy isPro={isPro} />
      <ToolSeoContent slug="passport-photo" />
    </>
  );
}
