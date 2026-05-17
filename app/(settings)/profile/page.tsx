import type { Metadata } from "next";

import { ProfileSettingsClient } from "@/components/account/profile-settings-client";
import { SettingsShell } from "@/components/account/settings-shell";
import { getSessionUser } from "@/lib/supabase/get-session-user";

export const metadata: Metadata = {
  title: "Profile Settings",
  description: "Manage your Clawdage profile, security, and account preferences.",
};

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) {
    return null;
  }

  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const initialFullName =
    (typeof meta?.full_name === "string" && meta.full_name) ||
    (typeof meta?.name === "string" && meta.name) ||
    "";
  const initialDisplayName =
    (typeof meta?.display_name === "string" && meta.display_name) ||
    initialFullName;

  return (
    <SettingsShell
      title="Profile Settings"
      description="Your data is processed locally. We only store your email to manage your access."
      contentClassName="max-w-2xl"
    >
      <ProfileSettingsClient
        email={user.email ?? ""}
        emailVerified={Boolean(user.email_confirmed_at)}
        initialFullName={initialFullName}
        initialDisplayName={initialDisplayName}
      />
    </SettingsShell>
  );
}
