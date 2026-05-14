import { HowItWorksSection } from "@/components/how-it-works-section";
import { ToolsPageCta } from "@/components/tools-page-cta";

export const metadata = {
  title: "How it works",
  description: "Browser-side processing and one-time passes explained.",
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      <HowItWorksSection />
      <ToolsPageCta />
    </div>
  );
}
