import { SettingsShell } from "@/components/account/settings-shell";
import { SettingsPageSkeleton } from "@/components/account/settings-page-skeleton";

export default function ProfileLoading() {
  return (
    <SettingsShell title="Profile Settings">
      <SettingsPageSkeleton cards={2} />
    </SettingsShell>
  );
}
