import { createClient } from "@/lib/supabase/server";
import { userHasActivePaidPlan, type ProfilePlanSnapshot } from "@/lib/get-profile-plan";

import type { TransactionRow } from "@/lib/account/types";

export { FREE_DAILY_TASK_LIMIT } from "@/lib/account/types";
export type { TransactionRow } from "@/lib/account/types";

function startOfUtcDayIso(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export type AccountProfile = {
  planType: string;
  accessUntilIso: string | null;
  memberSinceIso: string | null;
  email: string;
};

export type AccountStats = {
  totalFilesProcessed: number;
  mostUsedTool: string | null;
  freeTasksUsedToday: number;
};

export async function getAccountProfile(userId: string): Promise<AccountProfile | null> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan_type, access_until, created_at, email")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    return null;
  }

  return {
    planType: profile.plan_type ?? "free",
    accessUntilIso: profile.access_until ?? null,
    memberSinceIso: profile.created_at ?? null,
    email: profile.email ?? "",
  };
}

export async function getAccountTransactions(
  userId: string,
  limit = 20,
): Promise<TransactionRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select("id, order_id, payment_id, amount, status, plan_selected, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}

export async function getAccountStats(userId: string): Promise<AccountStats> {
  const supabase = await createClient();
  const dayStart = startOfUtcDayIso();

  const [totalRes, todayRes, usageRows] = await Promise.all([
    supabase
      .from("tool_usage")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("tool_usage")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("used_at", dayStart),
    supabase.from("tool_usage").select("tool_name").eq("user_id", userId).limit(500),
  ]);

  const counts = new Map<string, number>();
  for (const row of usageRows.data ?? []) {
    const name = row.tool_name ?? "unknown";
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  let mostUsedTool: string | null = null;
  let max = 0;
  for (const [tool, count] of counts) {
    if (count > max) {
      max = count;
      mostUsedTool = formatToolName(tool);
    }
  }

  return {
    totalFilesProcessed: totalRes.count ?? 0,
    mostUsedTool,
    freeTasksUsedToday: todayRes.count ?? 0,
  };
}

function formatToolName(slug: string): string {
  return slug
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function buildPlanSnapshot(
  planType: string,
  accessUntilIso: string | null,
): ProfilePlanSnapshot {
  return {
    status: "loaded",
    planType,
    accessUntil: accessUntilIso,
  };
}

export function isActivePaidPlan(planType: string, accessUntilIso: string | null): boolean {
  return userHasActivePaidPlan(buildPlanSnapshot(planType, accessUntilIso));
}
