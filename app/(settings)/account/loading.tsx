import { SettingsShell } from "@/components/account/settings-shell";
import { SettingsPageSkeleton } from "@/components/account/settings-page-skeleton";

export default function AccountLoading() {
  return (
    <SettingsShell title="Account Overview">
      <SettingsPageSkeleton cards={3} />
    </SettingsShell>
  );
}
