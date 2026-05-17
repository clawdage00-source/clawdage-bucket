import type { Metadata } from "next";

import { SubscriptionClient } from "@/components/account/subscription-client";
import { SettingsShell } from "@/components/account/settings-shell";
import {
  getAccountProfile,
  getAccountStats,
  getAccountTransactions,
  isActivePaidPlan,
} from "@/lib/account/get-account-data";
import { getSessionUser } from "@/lib/supabase/get-session-user";

export const metadata: Metadata = {
  title: "Subscription & Passes",
  description: "Manage your Clawdage passes, billing history, and upgrades.",
};

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const user = await getSessionUser();
  if (!user) {
    return null;
  }

  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const userName =
    (typeof meta?.full_name === "string" && meta.full_name) ||
    (typeof meta?.name === "string" && meta.name) ||
    "";

  const [profile, transactions, stats] = await Promise.all([
    getAccountProfile(user.id),
    getAccountTransactions(user.id),
    getAccountStats(user.id),
  ]);

  const planType = profile?.planType ?? "free";
  const accessUntilIso = profile?.accessUntilIso ?? null;

  return (
    <SettingsShell
      title="Subscription & Passes"
      description="We believe in fairness. You only pay for what you use. Your passes never auto-renew."
      contentClassName="max-w-4xl"
    >
      <SubscriptionClient
        userEmail={user.email ?? ""}
        userName={userName}
        planType={planType}
        accessUntilIso={accessUntilIso}
        isPaid={isActivePaidPlan(planType, accessUntilIso)}
        freeTasksUsedToday={stats.freeTasksUsedToday}
        transactions={transactions}
        showPaymentSuccess={params.status === "success"}
      />
    </SettingsShell>
  );
}
