"use server";

import { requireAdminAccessForAction } from "@/lib/supabase/admin-auth";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
  buildPeriodBuckets,
  formatBucketLabel,
  periodKeyFromIso,
  rangeDescription,
  resolveAnalyticsRange,
  type AnalyticsPeriod,
  type ResolvedAnalyticsRange,
} from "@/lib/admin/analytics-range";
import { getToolBySlug } from "@/lib/tools-data";

export type AdminStatsQuery = {
  period?: AnalyticsPeriod;
  startDate?: string;
  endDate?: string;
};

const PERIODS: AnalyticsPeriod[] = ["daily", "monthly", "yearly", "custom"];

function parseStatsQuery(
  periodInput?: string,
  startDate?: string,
  endDate?: string,
): AdminStatsQuery {
  const period =
    periodInput && PERIODS.includes(periodInput as AnalyticsPeriod)
      ? (periodInput as AnalyticsPeriod)
      : "daily";
  return {
    period,
    startDate: startDate?.trim() || undefined,
    endDate: endDate?.trim() || undefined,
  };
}

export type TimeSeriesPoint = {
  periodKey: string;
  label: string;
  visitors: number;
  pageViews: number;
  toolUses: number;
};

export type RevenueSeriesPoint = {
  periodKey: string;
  label: string;
  amount: number;
};

export type AdminAnalyticsStats = {
  query: {
    period: AnalyticsPeriod;
    startDate: string;
    endDate: string;
    granularity: "day" | "month" | "year";
    description: string;
  };
  summary: {
    totalVisitors: number;
    conversionRate: number;
    activeSessions24h: number;
    totalRevenue: number;
    bounceRate: number;
    searchQueries: number;
    pageViews: number;
    toolUses: number;
    signups: number;
  };
  trafficGrowth: TimeSeriesPoint[];
  revenueGrowth: RevenueSeriesPoint[];
  authStats: { guest: number; loggedIn: number };
  toolPopularity: { slug: string; name: string; count: number }[];
  recentEvents: {
    id: string;
    time: string;
    email: string | null;
    action: string;
    toolName: string | null;
  }[];
};

type AnalyticsRow = {
  id: string;
  event_name: string;
  tool_slug: string | null;
  user_id: string | null;
  session_id: string;
  path: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type TransactionRow = {
  amount: string | number;
  status: string;
  created_at: string;
};

function visitorKey(row: { user_id: string | null; session_id: string }): string {
  return row.user_id ?? row.session_id;
}

function formatInr(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function aggregateEvents(
  events: AnalyticsRow[],
  range: ResolvedAnalyticsRange,
): {
  summary: AdminAnalyticsStats["summary"];
  trafficGrowth: TimeSeriesPoint[];
  authStats: AdminAnalyticsStats["authStats"];
  toolPopularity: AdminAnalyticsStats["toolPopularity"];
} {
  const buckets = buildPeriodBuckets(range);
  const visitorsByBucket = new Map<string, Set<string>>();
  const pageViewsByBucket = new Map<string, number>();
  const toolUsesByBucket = new Map<string, number>();

  for (const key of buckets) {
    visitorsByBucket.set(key, new Set());
    pageViewsByBucket.set(key, 0);
    toolUsesByBucket.set(key, 0);
  }

  const allVisitors = new Set<string>();
  const sessionPageViews = new Map<string, Set<string>>();
  let guestVisits = 0;
  let loggedInVisits = 0;
  let searchQueries = 0;
  let signupEvents = 0;
  const toolCounts = new Map<string, number>();

  for (const row of events) {
    const bucket = periodKeyFromIso(row.created_at, range.granularity);
    const inBucket = visitorsByBucket.has(bucket);

    if (row.event_name === "page_view" || row.event_name === "tool_use") {
      allVisitors.add(visitorKey(row));
    }
    if (row.event_name === "search") searchQueries += 1;
    if (row.event_name === "auth_signup") signupEvents += 1;

    if (!inBucket) continue;

    if (row.event_name === "page_view") {
      visitorsByBucket.get(bucket)!.add(visitorKey(row));
      pageViewsByBucket.set(bucket, (pageViewsByBucket.get(bucket) ?? 0) + 1);
      const paths = sessionPageViews.get(row.session_id) ?? new Set<string>();
      paths.add(row.path ?? "/");
      sessionPageViews.set(row.session_id, paths);
      if (row.user_id) loggedInVisits += 1;
      else guestVisits += 1;
    }

    if (row.event_name === "tool_use") {
      toolUsesByBucket.set(bucket, (toolUsesByBucket.get(bucket) ?? 0) + 1);
      if (row.tool_slug) {
        toolCounts.set(row.tool_slug, (toolCounts.get(row.tool_slug) ?? 0) + 1);
      }
    }
  }

  let bouncedSessions = 0;
  for (const [, paths] of sessionPageViews) {
    if (paths.size <= 1) bouncedSessions += 1;
  }
  const bounceRate =
    sessionPageViews.size > 0
      ? Math.round((bouncedSessions / sessionPageViews.size) * 1000) / 10
      : 0;

  const signups = signupEvents;
  const totalVisitors = allVisitors.size;
  const conversionRate =
    totalVisitors > 0 ? Math.round((signups / totalVisitors) * 1000) / 10 : 0;

  let totalPageViews = 0;
  let totalToolUses = 0;
  const trafficGrowth: TimeSeriesPoint[] = buckets.map((periodKey) => {
    const visitors = visitorsByBucket.get(periodKey)?.size ?? 0;
    const pageViews = pageViewsByBucket.get(periodKey) ?? 0;
    const toolUses = toolUsesByBucket.get(periodKey) ?? 0;
    totalPageViews += pageViews;
    totalToolUses += toolUses;
    return {
      periodKey,
      label: formatBucketLabel(periodKey, range.granularity),
      visitors,
      pageViews,
      toolUses,
    };
  });

  const toolPopularity = [...toolCounts.entries()]
    .map(([slug, count]) => ({
      slug,
      name: getToolBySlug(slug)?.name ?? slug,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  return {
    summary: {
      totalVisitors,
      conversionRate,
      activeSessions24h: 0,
      totalRevenue: 0,
      bounceRate,
      searchQueries,
      pageViews: totalPageViews,
      toolUses: totalToolUses,
      signups,
    },
    trafficGrowth,
    authStats: { guest: guestVisits, loggedIn: loggedInVisits },
    toolPopularity,
  };
}

function aggregateRevenue(
  transactions: TransactionRow[],
  range: ResolvedAnalyticsRange,
): { totalRevenue: number; revenueGrowth: RevenueSeriesPoint[] } {
  const buckets = buildPeriodBuckets(range);
  const amountByBucket = new Map<string, number>();
  for (const key of buckets) amountByBucket.set(key, 0);

  let totalRevenue = 0;
  for (const row of transactions) {
    if (row.status !== "captured") continue;
    const n = Number.parseFloat(String(row.amount));
    if (!Number.isFinite(n)) continue;
    const bucket = periodKeyFromIso(row.created_at, range.granularity);
    if (!amountByBucket.has(bucket)) continue;
    amountByBucket.set(bucket, (amountByBucket.get(bucket) ?? 0) + n);
    totalRevenue += n;
  }

  const revenueGrowth: RevenueSeriesPoint[] = buckets.map((periodKey) => ({
    periodKey,
    label: formatBucketLabel(periodKey, range.granularity),
    amount: formatInr(amountByBucket.get(periodKey) ?? 0),
  }));

  return { totalRevenue: formatInr(totalRevenue), revenueGrowth };
}

function countActiveSessions24h(events: AnalyticsRow[]): number {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return new Set(
    events
      .filter((e) => new Date(e.created_at) >= since24h)
      .map((e) => e.session_id),
  ).size;
}

/** Fetch admin analytics for a period (server components and server actions). */
export async function getAdminStats(
  periodOrQuery: AdminStatsQuery | AnalyticsPeriod = "daily",
  startDate?: string,
  endDate?: string,
): Promise<AdminAnalyticsStats> {
  await requireAdminAccessForAction();

  const query: AdminStatsQuery =
    typeof periodOrQuery === "string"
      ? parseStatsQuery(periodOrQuery, startDate, endDate)
      : periodOrQuery;

  const range = resolveAnalyticsRange(query);
  const admin = createServiceRoleClient();
  if (!admin) {
    return emptyStats(range);
  }

  const [eventsRes, recentRes, transactionsRes] = await Promise.all([
    admin
      .from("analytics_events")
      .select("id, event_name, tool_slug, user_id, session_id, path, metadata, created_at")
      .gte("created_at", range.startIso)
      .lt("created_at", range.endIso)
      .order("created_at", { ascending: true })
      .limit(50_000),
    admin
      .from("analytics_events")
      .select("id, event_name, tool_slug, user_id, session_id, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("transactions")
      .select("amount, status, created_at")
      .eq("status", "captured")
      .gte("created_at", range.startIso)
      .lt("created_at", range.endIso),
  ]);

  const events = (eventsRes.data ?? []) as AnalyticsRow[];
  const recentRaw = recentRes.data ?? [];
  const transactions = (transactionsRes.data ?? []) as TransactionRow[];

  const aggregated = aggregateEvents(events, range);
  const revenue = aggregateRevenue(transactions, range);

  const signups = aggregated.summary.signups;
  const conversionRate =
    aggregated.summary.totalVisitors > 0
      ? Math.round((signups / aggregated.summary.totalVisitors) * 1000) / 10
      : 0;

  const userIds = [
    ...new Set(recentRaw.map((r) => r.user_id).filter((id): id is string => Boolean(id))),
  ];
  const emailByUser = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, email")
      .in("id", userIds);
    for (const p of profiles ?? []) {
      emailByUser.set(p.id, p.email);
    }
  }

  const recentEvents = recentRaw.map((row) => ({
    id: row.id,
    time: row.created_at,
    email: row.user_id ? (emailByUser.get(row.user_id) ?? "User") : "Guest",
    action: formatEventLabel(row.event_name),
    toolName: row.tool_slug
      ? (getToolBySlug(row.tool_slug)?.name ?? row.tool_slug)
      : null,
  }));

  return {
    query: {
      period: range.period,
      startDate: range.startDate,
      endDate: range.endDate,
      granularity: range.granularity,
      description: rangeDescription(range),
    },
    summary: {
      ...aggregated.summary,
      conversionRate,
      signups,
      activeSessions24h: countActiveSessions24h(events),
      totalRevenue: revenue.totalRevenue,
    },
    trafficGrowth: aggregated.trafficGrowth,
    revenueGrowth: revenue.revenueGrowth,
    authStats: aggregated.authStats,
    toolPopularity: aggregated.toolPopularity,
    recentEvents,
  };
}

function formatEventLabel(eventName: string): string {
  switch (eventName) {
    case "page_view":
      return "Page view";
    case "tool_use":
      return "Tool used";
    case "search":
      return "Search";
    case "auth_login":
      return "Signed in";
    case "auth_signup":
      return "Signed up";
    default:
      return eventName.replace(/_/g, " ");
  }
}

function emptyStats(range: ResolvedAnalyticsRange): AdminAnalyticsStats {
  const desc = rangeDescription(range);
  const buckets = buildPeriodBuckets(range);
  const trafficGrowth: TimeSeriesPoint[] = buckets.map((periodKey) => ({
    periodKey,
    label: formatBucketLabel(periodKey, range.granularity),
    visitors: 0,
    pageViews: 0,
    toolUses: 0,
  }));
  const revenueGrowth: RevenueSeriesPoint[] = buckets.map((periodKey) => ({
    periodKey,
    label: formatBucketLabel(periodKey, range.granularity),
    amount: 0,
  }));

  return {
    query: {
      period: range.period,
      startDate: range.startDate,
      endDate: range.endDate,
      granularity: range.granularity,
      description: desc,
    },
    summary: {
      totalVisitors: 0,
      conversionRate: 0,
      activeSessions24h: 0,
      totalRevenue: 0,
      bounceRate: 0,
      searchQueries: 0,
      pageViews: 0,
      toolUses: 0,
      signups: 0,
    },
    trafficGrowth,
    revenueGrowth,
    authStats: { guest: 0, loggedIn: 0 },
    toolPopularity: [],
    recentEvents: [],
  };
}
