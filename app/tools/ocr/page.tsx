import type { Metadata } from "next";

import { OcrToolLazy } from "@/app/tools/ocr/ocr-tool-loader";
import { getProfilePlanSnapshot, userHasActivePaidPlan } from "@/lib/get-profile-plan";

export const metadata: Metadata = {
  title: "AI Handwriting OCR (Pro) — Groq Vision",
  description:
    "Upload an image: Groq Vision extracts handwriting and printed text and detects the document language automatically. Requires an active pass.",
};

export default async function OcrPage() {
  const snapshot = await getProfilePlanSnapshot();
  const isPro = userHasActivePaidPlan(snapshot);

  return <OcrToolLazy isPro={isPro} />;
}
