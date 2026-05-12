import type { Metadata } from "next";

import { ImageCompressorTool } from "@/components/tools/image-compressor-tool";
import { getProfilePlanSnapshot, userHasActivePaidPlan } from "@/lib/get-profile-plan";

export const metadata: Metadata = {
  title: "Online Image Compressor - Reduce Image Size for Free",
  description:
    "Compress images to specific sizes (like 200KB) for Indian exam portals and government forms. Fast, private, and secure.",
};

export default async function ImageCompressorPage() {
  const snapshot = await getProfilePlanSnapshot();
  const canBulk = userHasActivePaidPlan(snapshot);

  return <ImageCompressorTool canBulk={canBulk} />;
}
