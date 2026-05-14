"use client";

import { differenceInCalendarDays, formatDistanceToNowStrict } from "date-fns";
import { CheckCircle, Clock, CreditCard, Loader2, User } from "lucide-react";
import Link from "next/link";
import { useActionState, useMemo } from "react";

import { updateProfileSettings, type ProfileSettingsState } from "@/actions/profile-settings";
import { passDurationMs } from "@/lib/payments/access-until";
import type { PassId } from "@/lib/pricing-passes";

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  daily: "Daily Pass",
  weekly: "Weekly Pass",
  monthly: "Monthly Pass",
  yearly: "Yearly Pass",
};

type TxRow = {
  id: string;
  order_id: string;
  payment_id: string | null;
  amount: string;
  status: string;
  plan_selected: string;
  created_at: string | null;
};

type ProfilePageClientProps = {
  email: string;
  initialFullName: string;
  initialAvatarUrl: string;
  planType: string;
  accessUntilIso: string | null;
  transactions: TxRow[];
  showPaymentSuccess: boolean;
};

function isPaidPassId(id: string): id is PassId {
  return id === "daily" || id === "weekly" || id === "monthly" || id === "yearly";
}

export function ProfilePageClient({
  email,
  initialFullName,
  initialAvatarUrl,
  planType,
  accessUntilIso,
  transactions,
  showPaymentSuccess,
}: ProfilePageClientProps) {
  const [settingsState, formAction, isSettingsPending] = useActionState<
    ProfileSettingsState | undefined,
    FormData
  >(updateProfileSettings, undefined);

  const accessUntil = useMemo(() => {
    if (!accessUntilIso) {
      return null;
    }
    const d = new Date(accessUntilIso);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [accessUntilIso]);
  const now = new Date();
  const hasValidPaidWindow =
    planType !== "free" &&
    accessUntil &&
    !Number.isNaN(accessUntil.getTime()) &&
    accessUntil > now;

  const expiredOrFree = planType === "free" || !hasValidPaidWindow;

  const remainingLabel = useMemo(() => {
    const tick = new Date();
    if (!accessUntil || Number.isNaN(accessUntil.getTime())) {
      return null;
    }
    if (accessUntil <= tick) {
      return "Access ended";
    }
    const days = differenceInCalendarDays(accessUntil, tick);
    if (days >= 1) {
      return `${days} day${days === 1 ? "" : "s"} remaining`;
    }
    return `${formatDistanceToNowStrict(accessUntil, { addSuffix: true })}`;
  }, [accessUntil]);

  const progressPct = useMemo(() => {
    if (!hasValidPaidWindow || !accessUntil || !isPaidPassId(planType)) {
      return null;
    }
    const tick = new Date();
    const totalMs = passDurationMs(planType);
    const end = accessUntil.getTime();
    const start = end - totalMs;
    const t = tick.getTime();
    if (end <= start) {
      return 0;
    }
    const elapsed = Math.min(Math.max(t - start, 0), end - start);
    const remainingRatio = 1 - elapsed / (end - start);
    return Math.round(remainingRatio * 100);
  }, [accessUntil, hasValidPaidWindow, planType]);

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-6 py-12 sm:py-16">
      {showPaymentSuccess ? (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden />
          <div>
            <p className="font-semibold">Payment successful</p>
            <p className="mt-0.5 text-emerald-900/90">Your pass is active. Enjoy unlimited access for this period.</p>
          </div>
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          <Clock className="h-4 w-4" aria-hidden />
          Active plan
        </div>
        <h2 className="mt-2 text-2xl font-bold text-black">{PLAN_LABELS[planType] ?? planType}</h2>
        {remainingLabel && hasValidPaidWindow ? (
          <p className="mt-1 text-sm text-slate-600">{remainingLabel}</p>
        ) : expiredOrFree ? (
          <p className="mt-1 text-sm text-slate-600">You are on the free tier (limited daily usage on select tools).</p>
        ) : (
          <p className="mt-1 text-sm text-slate-600">Access window could not be calculated.</p>
        )}

        {progressPct !== null ? (
          <div className="mt-5">
            <div className="mb-1 flex justify-between text-xs font-medium text-slate-600">
              <span>Pass window</span>
              <span>{progressPct}% left</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-black transition-[width]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        ) : null}

        {expiredOrFree ? (
          <Link
            href="/subscription"
            className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-black px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-zinc-800 sm:w-auto"
          >
            Upgrade to Pro
          </Link>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-bold text-black">
          <span className="inline-flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-slate-600" aria-hidden />
            Transaction history
          </span>
        </h2>
        <p className="mt-1 text-sm text-slate-600">Last five payments on this account.</p>
        {transactions.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">No transactions yet.</p>
        ) : (
          <ul className="mt-6 divide-y divide-slate-100">
            {transactions.map((tx) => (
              <li key={tx.id} className="flex flex-col gap-1 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-black">{PLAN_LABELS[tx.plan_selected] ?? tx.plan_selected}</p>
                  <p className="text-xs text-slate-500">
                    {tx.created_at
                      ? new Date(tx.created_at).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : tx.order_id}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-semibold text-black">₹{Number(tx.amount).toFixed(0)}</p>
                  <p className="text-xs capitalize text-slate-500">{tx.status}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-bold text-black">
          <span className="inline-flex items-center gap-2">
            <User className="h-5 w-5 text-slate-600" aria-hidden />
            Profile settings
          </span>
        </h2>
        <p className="mt-1 text-sm text-slate-600">Synced with your Supabase account (display name and avatar URL).</p>

        <form action={formAction} className="mt-6 space-y-5">
          <div>
            <label htmlFor="profile-email" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Email
            </label>
            <input
              id="profile-email"
              type="email"
              value={email}
              readOnly
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700"
            />
          </div>
          <div>
            <label htmlFor="full_name" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Display name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              defaultValue={initialFullName}
              placeholder="Your name"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-black outline-none ring-black/10 focus:ring-2"
            />
          </div>
          <div>
            <label htmlFor="avatar_url" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Avatar URL
            </label>
            <input
              id="avatar_url"
              name="avatar_url"
              type="url"
              defaultValue={initialAvatarUrl}
              placeholder="https://…"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-black outline-none ring-black/10 focus:ring-2"
            />
            {initialAvatarUrl ? (
              <div className="mt-3 flex items-center gap-3">
                <span className="text-xs text-slate-500">Preview</span>
                {/* eslint-disable-next-line @next/next/no-img-element -- remote user-provided URL */}
                <img src={initialAvatarUrl} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
              </div>
            ) : null}
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

          <button
            type="submit"
            disabled={isSettingsPending}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
          >
            {isSettingsPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </button>
        </form>
      </section>
    </div>
  );
}
