import Link from "next/link";

import { SubscriptionCheckoutSection } from "@/components/subscription-checkout-section";
import { formatPlanBanner, getProfilePlanSnapshot } from "@/lib/get-profile-plan";
import { getSessionUser } from "@/lib/supabase/get-session-user";

export const metadata = {
  title: "Subscription",
  description: "Buy a Daily, Weekly, Monthly, or Yearly pass. Secure checkout with Razorpay.",
};

export default async function SubscriptionPage() {
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
    <div className="min-h-screen bg-white pb-16">
      <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-12 sm:py-14">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">Passes & billing</h1>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-slate-600 sm:text-base">
            One-time passes. No auto-debit. Pay with Razorpay and unlock Pro tools instantly.
          </p>
          <Link
            href="/profile"
            className="mt-5 inline-block text-sm font-semibold text-black underline underline-offset-4 hover:text-slate-700"
          >
            View profile & receipts
          </Link>
        </div>
      </div>

      {planLine ? (
        <div className="mx-auto mt-8 max-w-6xl px-6">
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm leading-relaxed text-slate-700">{planLine}</p>
          </div>
        </div>
      ) : null}

      <div className="mt-10 sm:mt-12">
        <SubscriptionCheckoutSection userEmail={userEmail} userName={userName} />
      </div>
    </div>
  );
}
