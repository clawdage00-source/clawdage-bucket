import type { Metadata } from "next";

import { OcrToolLazy } from "@/app/tools/ocr/ocr-tool-loader";
import { getProfilePlanSnapshot, userHasActivePaidPlan } from "@/lib/get-profile-plan";

export const metadata: Metadata = {
  title: "Free Online OCR — Printed & Handwriting (Pro)",
  description:
    "Extract text from images in your browser: Tesseract for printed text, optional TrOCR handwriting AI (Daily Pass). Canvas cleanup, confidence review, WebP/JPG/PNG and more — files stay on your device.",
};

export default async function OcrPage() {
  const snapshot = await getProfilePlanSnapshot();
  const isPro = userHasActivePaidPlan(snapshot);

  return <OcrToolLazy isPro={isPro} />;
}
