import Link from "next/link";

import { PricingFaq } from "@/components/pricing-faq";
import { SubscriptionCheckoutSection } from "@/components/subscription-checkout-section";
import { ToolsPageCta } from "@/components/tools-page-cta";
import { formatPlanBanner, getProfilePlanSnapshot } from "@/lib/get-profile-plan";
import { getSessionUser } from "@/lib/supabase/get-session-user";

import { MotionFadeIn } from "./pricing-motion";

export const metadata = {
  title: "Pricing",
  description: "Simple passes from ₹19. No subscriptions. No hidden fees.",
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
    <div className="min-h-screen bg-white pb-8">
      <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-14 sm:py-16">
        <MotionFadeIn className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">
            Simple, Transparent Pricing.
          </h1>
          <p className="mt-4 text-pretty text-base leading-relaxed text-slate-600 sm:text-lg">
            No recurring subscriptions. No hidden fees. Just pay for what you need.
          </p>
        </MotionFadeIn>
      </div>

      {planLine ? (
        <div className="mx-auto mt-8 max-w-6xl px-6">
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm leading-relaxed text-slate-700">{planLine}</p>
            {snapshot.status === "anonymous" ? (
              <Link
                href="/login"
                className="shrink-0 text-sm font-semibold text-black underline underline-offset-4 hover:text-slate-700"
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

      <MotionFadeIn className="mx-auto mt-14 max-w-3xl px-6 sm:mt-16">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-5 py-6 sm:px-8 sm:py-8">
          <h2 className="text-lg font-bold text-black sm:text-xl">Free plan</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
            3 files/day, basic tools, with ads. No credit card required.
          </p>
        </div>
      </MotionFadeIn>

      <div className="mt-14 sm:mt-16">
        <PricingFaq />
      </div>

      <ToolsPageCta />
    </div>
  );
}
