import type { Metadata } from "next";

import { IdResizerTool } from "@/components/tools/id-resizer-tool";
import { getProfilePlanSnapshot, userHasActivePaidPlan } from "@/lib/get-profile-plan";

export const metadata: Metadata = {
  title: "Aadhar & PAN Card Resizer Online - Under 50KB/100KB",
  description:
    "Specifically designed for Indian exam and government portals. Resize Aadhar, PAN, and Passport photos to exact dimensions and KB limits. Secure and private.",
};

export default async function IdResizerPage() {
  const snapshot = await getProfilePlanSnapshot();
  const isPro = userHasActivePaidPlan(snapshot);

  return <IdResizerTool isPro={isPro} />;
}
