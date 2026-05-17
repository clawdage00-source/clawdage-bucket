import type { Metadata } from "next";

import { AccountOverviewClient } from "@/components/account/account-overview-client";
import { SettingsShell } from "@/components/account/settings-shell";
import {
  getAccountProfile,
  getAccountStats,
  isActivePaidPlan,
} from "@/lib/account/get-account-data";
import { getSessionUser } from "@/lib/supabase/get-session-user";

export const metadata: Metadata = {
  title: "Account Overview",
  description: "Your Clawdage account command center — plan status, usage, and quick actions.",
};

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) {
    return null;
  }

  const [profile, stats] = await Promise.all([
    getAccountProfile(user.id),
    getAccountStats(user.id),
  ]);

  const planType = profile?.planType ?? "free";
  const accessUntilIso = profile?.accessUntilIso ?? null;
  const email = user.email ?? profile?.email ?? "";

  return (
    <SettingsShell
      title="Account Overview"
      description="Your command center for passes, usage, and account shortcuts."
      contentClassName="max-w-6xl"
    >
      <AccountOverviewClient
        email={email}
        memberSinceIso={profile?.memberSinceIso ?? user.created_at ?? null}
        planType={planType}
        accessUntilIso={accessUntilIso}
        isPaid={isActivePaidPlan(planType, accessUntilIso)}
        totalFilesProcessed={stats.totalFilesProcessed}
        mostUsedTool={stats.mostUsedTool}
      />
    </SettingsShell>
  );
}
