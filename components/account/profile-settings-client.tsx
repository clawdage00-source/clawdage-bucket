"use client";

import { Loader2, Monitor, ShieldCheck } from "lucide-react";
import { useActionState, useEffect, useState } from "react";

import {
  deleteAccount,
  signOutEverywhere,
  updateProfileSettings,
  type DeleteAccountState,
  type ProfileSettingsState,
} from "@/actions/account-actions";
import {
  AccountCard,
  AccountCardContent,
  AccountCardHeader,
  CardDescription,
  CardTitle,
} from "@/components/account/account-card";
import { parseUserAgent } from "@/lib/analytics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ProfileSettingsClientProps = {
  email: string;
  emailVerified: boolean;
  initialFullName: string;
  initialDisplayName: string;
};

/** Browser/OS label — set after mount to avoid SSR/client navigator mismatch. */
function useSessionDeviceLabel(): string {
  const [label, setLabel] = useState("this device");

  useEffect(() => {
    const { browser, os } = parseUserAgent(navigator.userAgent);
    setLabel(`${browser} on ${os}`);
  }, []);

  return label;
}

export function ProfileSettingsClient({
  email,
  emailVerified,
  initialFullName,
  initialDisplayName,
}: ProfileSettingsClientProps) {
  const deviceLabel = useSessionDeviceLabel();

  const [settingsState, formAction, isSettingsPending] = useActionState<
    ProfileSettingsState | undefined,
    FormData
  >(updateProfileSettings, undefined);

  const [deleteState, deleteAction, isDeletePending] = useActionState<
    DeleteAccountState | undefined,
    FormData
  >(deleteAccount, undefined);

  return (
    <div className="space-y-6 sm:space-y-8">
      <AccountCard>
        <AccountCardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Personal info</CardTitle>
          <CardDescription className="leading-relaxed">
            Your data is processed locally. We only store your email to manage your access.
          </CardDescription>
        </AccountCardHeader>
        <AccountCardContent>
          <form action={formAction} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="full_name"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Full name
              </label>
              <Input
                id="full_name"
                name="full_name"
                defaultValue={initialFullName}
                placeholder="Your full name"
                className="h-11 border-border"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="display_name"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Display name
              </label>
              <Input
                id="display_name"
                name="display_name"
                defaultValue={initialDisplayName}
                placeholder="How we greet you"
                className="h-11 border-border"
              />
            </div>

            {settingsState && !settingsState.ok ? (
              <p className="text-sm text-red-700" role="alert">
                {settingsState.error}
              </p>
            ) : null}
            {settingsState?.ok && settingsState.message ? (
              <p className="text-sm text-emerald-800" role="status">
                {settingsState.message}
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={isSettingsPending}
              className="h-11 bg-black px-6 text-white hover:bg-zinc-800"
            >
              {isSettingsPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </form>
        </AccountCardContent>
      </AccountCard>

      <AccountCard>
        <AccountCardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Email</CardTitle>
          <CardDescription className="leading-relaxed">
            Your email is your sign-in ID and cannot be changed here.
          </CardDescription>
        </AccountCardHeader>
        <AccountCardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
            <Input
              readOnly
              value={email}
              className="h-11 w-full border-border bg-muted text-muted-foreground sm:max-w-md"
            />
            {emailVerified ? (
              <Badge className="w-fit gap-1 border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-800 hover:bg-emerald-50">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                Verified
              </Badge>
            ) : (
              <Badge variant="outline" className="w-fit border-border px-3 py-1 text-muted-foreground">
                Unverified
              </Badge>
            )}
          </div>
        </AccountCardContent>
      </AccountCard>

      <AccountCard>
        <AccountCardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Security</CardTitle>
        </AccountCardHeader>
        <AccountCardContent className="space-y-6">
          <div className="flex items-start gap-4 rounded-xl border border-border bg-muted px-4 py-4 sm:px-5 sm:py-5">
            <Monitor className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-foreground">Active session</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Currently logged in on{" "}
                <span className="font-medium text-foreground">{deviceLabel}</span>
              </p>
            </div>
          </div>

          <form action={signOutEverywhere}>
            <Button type="submit" variant="outline" className="h-11 border-border px-6">
              Log out everywhere
            </Button>
          </form>
        </AccountCardContent>
      </AccountCard>

      <AccountCard className="border-red-200">
        <AccountCardHeader className="border-red-100">
          <CardTitle className="text-lg font-semibold text-red-900">Danger zone</CardTitle>
          <CardDescription className="leading-relaxed text-red-800/80">
            Permanently delete your account and all associated data. This cannot be undone.
          </CardDescription>
        </AccountCardHeader>
        <AccountCardContent>
          <form action={deleteAction} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="confirm"
                className="text-xs font-semibold uppercase tracking-wider text-red-800"
              >
                Type DELETE to confirm
              </label>
              <Input
                id="confirm"
                name="confirm"
                placeholder="DELETE"
                className="h-11 max-w-xs border-red-200"
                autoComplete="off"
              />
            </div>
            {deleteState && !deleteState.ok ? (
              <p className="text-sm text-red-700" role="alert">
                {deleteState.error}
              </p>
            ) : null}
            <Button type="submit" variant="destructive" disabled={isDeletePending} className="h-11 px-6">
              {isDeletePending ? "Deleting…" : "Delete account"}
            </Button>
          </form>
        </AccountCardContent>
      </AccountCard>
    </div>
  );
}
