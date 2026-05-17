import Link from "next/link";

import { PricingComparison } from "@/components/pricing-comparison";
import { PricingFaq } from "@/components/pricing-faq";
import { PricingTestimonials } from "@/components/pricing-testimonials";
import { SubscriptionCheckoutSection } from "@/components/subscription-checkout-section";
import { ToolsPageCta } from "@/components/tools-page-cta";
import { TrustSection } from "@/components/TrustSection";
import { formatPlanBanner, getProfilePlanSnapshot } from "@/lib/get-profile-plan";
import { getSessionUser } from "@/lib/supabase/get-session-user";

import { MotionFadeIn } from "./pricing-motion";

export const metadata = {
  title: "Pricing — Daily Pass from ₹19 | No Auto Debit",
  description:
    "Perfect for one-time government applications. ₹19 Daily Pass, no auto-debit, browser-first privacy. Compare free vs pass.",
  alternates: { canonical: "/pricing" },
};

export default async function PricingPage() {
  const snapshot = await getProfilePlanSnapshot();
  const planLine = formatPlanBanner(snapshot);
  const user = await getSessionUser();

  const userEmail = user?.email ?? "";
  const meta = user?.user_metadata as Record<string, unknown> | undefined;
  const userName =
    (typeof meta?.full_name === "string" && meta.full_name) ||
    (typeof meta?.name === "string" && meta.name) ||
    "";

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="border-b border-border bg-muted/50 px-6 py-14 sm:py-16">
        <MotionFadeIn className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Simple, Transparent Pricing.
          </h1>
          <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Perfect for one-time government applications. No recurring subscriptions —{" "}
            <strong className="font-semibold text-foreground">no auto-debit ever</strong>.
          </p>
          <p className="mt-3 text-sm font-medium text-[#251EFF]">
            ₹19 Daily Pass · Students &amp; exam applicants welcome
          </p>
        </MotionFadeIn>
      </div>

      {planLine ? (
        <div className="mx-auto mt-8 max-w-6xl px-6">
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm leading-relaxed text-muted-foreground">{planLine}</p>
            {snapshot.status === "anonymous" ? (
              <Link
                href="/login"
                className="shrink-0 text-sm font-semibold text-foreground underline underline-offset-4 hover:text-muted-foreground"
              >
                Sign in
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-10 sm:mt-12">
        <SubscriptionCheckoutSection userEmail={userEmail} userName={userName} />
      </div>

      <MotionFadeIn className="mx-auto mt-14 max-w-4xl px-6 sm:mt-16">
        <h2 className="text-center text-xl font-bold text-foreground sm:text-2xl">Free vs Daily Pass</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted-foreground">
          One ₹19 pass for your SSC, NEET, or PAN upload day — not a monthly trap.
        </p>
        <div className="mt-8">
          <PricingComparison />
        </div>
      </MotionFadeIn>

      <PricingTestimonials />

      <MotionFadeIn className="mx-auto mt-14 max-w-3xl px-6 sm:mt-16">
        <div className="rounded-2xl border border-border bg-muted/80 px-5 py-6 sm:px-8 sm:py-8">
          <h2 className="text-lg font-bold text-foreground sm:text-xl">Free plan</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            3 files/day, basic tools, with ads. No credit card required.
          </p>
        </div>
      </MotionFadeIn>

      <div className="mt-14 sm:mt-16">
        <PricingFaq />
      </div>

      <TrustSection variant="compact" />
      <ToolsPageCta />
    </div>
  );
}
