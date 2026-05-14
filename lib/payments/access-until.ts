import { addDays, addHours } from "date-fns";

import type { PassId } from "@/lib/pricing-passes";

const MS_DAY = 24 * 60 * 60 * 1000;

export function passDurationMs(planId: PassId): number {
  switch (planId) {
    case "daily":
      return MS_DAY;
    case "weekly":
      return 7 * MS_DAY;
    case "monthly":
      return 30 * MS_DAY;
    case "yearly":
      return 365 * MS_DAY;
  }
}

/**
 * Extends access from `max(now, currentAccessUntil)` by the pass window.
 */
export function computeAccessUntil(
  currentAccessUntilIso: string | null | undefined,
  planId: PassId,
): Date {
  const now = new Date();
  let base = now;
  if (currentAccessUntilIso) {
    const cur = new Date(currentAccessUntilIso);
    if (!Number.isNaN(cur.getTime()) && cur > base) {
      base = cur;
    }
  }
  switch (planId) {
    case "daily":
      return addHours(base, 24);
    case "weekly":
      return addDays(base, 7);
    case "monthly":
      return addDays(base, 30);
    case "yearly":
      return addDays(base, 365);
  }
}
