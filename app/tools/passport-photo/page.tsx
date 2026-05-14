import type { Metadata } from "next";

import { PassportPhotoToolLazy } from "@/app/tools/passport-photo/passport-photo-tool-loader";
import { getProfilePlanSnapshot, userHasActivePaidPlan } from "@/lib/get-profile-plan";

export const metadata: Metadata = {
  title: "Online Passport Photo Maker - Create Print-Ready Sheets",
  description:
    "Convert any selfie into a professional 3.5×4.5cm passport photo. Auto-remove background, create 8-photo print sheets, and save as PDF. Perfect for Indian Passports & Visas.",
};

export default async function PassportPhotoPage() {
  const snapshot = await getProfilePlanSnapshot();
  const isPro = userHasActivePaidPlan(snapshot);

  return <PassportPhotoToolLazy isPro={isPro} />;
}
