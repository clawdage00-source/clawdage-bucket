import { format } from "date-fns";

import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type ProfilePlanSnapshot =
  | { status: "unconfigured" }
  | { status: "anonymous" }
  | {
      status: "loaded";
      planType: string;
      accessUntil: string | null;
    };

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  daily: "Daily Pass",
  weekly: "Weekly Pass",
  monthly: "Monthly Pass",
  yearly: "Yearly Pass",
};

function planDisplayName(planType: string): string {
  return PLAN_LABELS[planType] ?? planType.replace(/_/g, " ");
}

/**
 * When `FREEMODE=development` is set in the environment (typically `.env.local`),
 * Pro-style tool gates (bulk compress, QR Pro exports, etc.) unlock without a paid pass.
 * Use only on trusted local machines; do not set in production.
 */
export function isFreemodeDevelopment(): boolean {
  return process.env.FREEMODE === "development";
}

/**
 * Reads `profiles.plan_type` and `profiles.access_until` for the signed-in user.
 * Safe when Supabase is not configured or the user is logged out.
 */
export async function getProfilePlanSnapshot(): Promise<ProfilePlanSnapshot> {
  if (!getSupabaseEnv().ok) {
    return { status: "unconfigured" };
  }
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { status: "anonymous" };
    }
    const { data } = await supabase
      .from("profiles")
      .select("plan_type, access_until")
      .eq("id", user.id)
      .maybeSingle();

    return {
      status: "loaded",
      planType: data?.plan_type ?? "free",
      accessUntil: data?.access_until ?? null,
    };
  } catch {
    return { status: "unconfigured" };
  }
}

/** Human-readable line for the pricing banner (server-rendered). */
export function formatPlanBanner(snapshot: ProfilePlanSnapshot): string | null {
  if (snapshot.status === "unconfigured") {
    return null;
  }
  if (snapshot.status === "anonymous") {
    return "Sign in to see your active pass and billing profile on this account.";
  }
  const { planType, accessUntil } = snapshot;
  const label = planDisplayName(planType);

  if (!accessUntil || planType === "free") {
    return `Your current plan: ${label} — 3 files/day on free tools until you upgrade.`;
  }

  const until = new Date(accessUntil);
  const now = new Date();
  if (Number.isNaN(until.getTime())) {
    return `Your current plan: ${label}.`;
  }
  if (until <= now) {
    return `Your current plan: Free — your ${label} ended on ${format(until, "MMM d, yyyy")}.`;
  }
  return `Your current plan: ${label} — access until ${format(until, "MMM d, yyyy, h:mm a")}.`;
}

/** Paid pass with valid access window — unlocks bulk tools (e.g. multi-file compress). */
export function userHasActivePaidPlan(snapshot: ProfilePlanSnapshot): boolean {
  if (isFreemodeDevelopment()) {
    return true;
  }
  if (snapshot.status !== "loaded") {
    return false;
  }
  const { planType, accessUntil } = snapshot;
  if (planType === "free") {
    return false;
  }
  if (!accessUntil) {
    return true;
  }
  const until = new Date(accessUntil);
  if (Number.isNaN(until.getTime())) {
    return true;
  }
  return until > new Date();
}
