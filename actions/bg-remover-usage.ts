"use server";

import { getProfilePlanSnapshot, isFreemodeDevelopment, userHasActivePaidPlan } from "@/lib/get-profile-plan";
import { BG_REMOVER_TOOL_NAME, type BgRemoverEligibility } from "@/lib/bg-remover-usage-shared";
import { createClient } from "@/lib/supabase/server";

const FREE_DAILY_LIMIT = 3;

function startOfUtcDayIso(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * Step 1: paid plan → unlimited.
 * Step 2: signed-in free → allow if fewer than FREE_DAILY_LIMIT rows in tool_usage today (UTC day).
 * Anonymous / unconfigured: allowed (browser enforces 3/day via localStorage).
 */
export async function getBgRemoverEligibility(): Promise<BgRemoverEligibility> {
  if (isFreemodeDevelopment()) {
    return { unlimited: true, usedToday: 0, isLoggedIn: true, allowed: true };
  }

  const snapshot = await getProfilePlanSnapshot();
  if (snapshot.status === "unconfigured") {
    return { unlimited: true, usedToday: 0, isLoggedIn: false, allowed: true };
  }
  if (snapshot.status === "anonymous") {
    return { unlimited: false, usedToday: 0, isLoggedIn: false, allowed: true };
  }
  if (userHasActivePaidPlan(snapshot)) {
    return { unlimited: true, usedToday: 0, isLoggedIn: true, allowed: true };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { unlimited: false, usedToday: 0, isLoggedIn: false, allowed: true };
    }
    const { count, error } = await supabase
      .from("tool_usage")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("tool_name", BG_REMOVER_TOOL_NAME)
      .gte("used_at", startOfUtcDayIso());

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[bg-remover] tool_usage count failed:", error.message);
      }
      return { unlimited: false, usedToday: 0, isLoggedIn: true, allowed: true };
    }
    const used = count ?? 0;
    return {
      unlimited: false,
      usedToday: used,
      isLoggedIn: true,
      allowed: used < FREE_DAILY_LIMIT,
    };
  } catch {
    return { unlimited: false, usedToday: 0, isLoggedIn: true, allowed: true };
  }
}

/** Call after a successful in-browser removal (signed-in users only). */
export async function recordBgRemoverUsage(): Promise<{ ok: boolean; error?: string }> {
  if (isFreemodeDevelopment()) {
    return { ok: true };
  }
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { ok: true };
    }
    const { error } = await supabase.from("tool_usage").insert({
      user_id: user.id,
      tool_name: BG_REMOVER_TOOL_NAME,
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
