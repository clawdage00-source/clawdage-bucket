import type { Metadata } from "next";

import { QrGeneratorTool } from "@/components/tools/qr-generator-tool";
import { getProfilePlanSnapshot, userHasActivePaidPlan } from "@/lib/get-profile-plan";

export const metadata: Metadata = {
  title: "Professional QR Code Generator - Create Custom UPI & WiFi QRs",
  description:
    "Generate high-quality QR codes for URLs, WiFi, VCards, and UPI payments. Add your own logo and custom colors. Private and secure.",
};

export default async function QrGeneratorPage() {
  const snapshot = await getProfilePlanSnapshot();
  const isPro = userHasActivePaidPlan(snapshot);

  return <QrGeneratorTool isPro={isPro} />;
}
