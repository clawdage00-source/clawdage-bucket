import { SettingsShell } from "@/components/account/settings-shell";
import { SettingsPageSkeleton } from "@/components/account/settings-page-skeleton";

export default function SubscriptionLoading() {
  return (
    <SettingsShell title="Subscription & Passes">
      <SettingsPageSkeleton cards={2} />
    </SettingsShell>
  );
}
