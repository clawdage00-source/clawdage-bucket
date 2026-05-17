"use server";

import { requireAdminAccess } from "@/lib/supabase/admin-auth";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getToolBySlug } from "@/lib/tools-data";

export type AdminAnalyticsStats = {
  summary: {
    totalVisitors: number;
    conversionRate: number;
    activeSessions24h: number;
    totalRevenue: number;
    bounceRate: number;
    searchQueries: number;
  };
  trafficGrowth: { date: string; visitors: number }[];
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

function visitorKey(row: { user_id: string | null; session_id: string }): string {
  return row.user_id ?? row.session_id;
}

function formatDateKey(iso: string): string {
  return iso.slice(0, 10);
}

function formatInr(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export async function getAdminStats(): Promise<AdminAnalyticsStats> {
  await requireAdminAccess();

  const admin = createServiceRoleClient();
  if (!admin) {
    return emptyStats();
  }

  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    eventsRes,
    recentRes,
    transactionsRes,
    profilesRes,
  ] = await Promise.all([
    admin
      .from("analytics_events")
      .select("id, event_name, tool_slug, user_id, session_id, path, metadata, created_at")
      .gte("created_at", since30.toISOString())
      .order("created_at", { ascending: true })
      .limit(50_000),
    admin
      .from("analytics_events")
      .select("id, event_name, tool_slug, user_id, session_id, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    admin.from("transactions").select("amount, status, created_at").eq("status", "captured"),
    admin.from("profiles").select("id, created_at"),
  ]);

  const events = (eventsRes.data ?? []) as AnalyticsRow[];
  const recentRaw = recentRes.data ?? [];

  const totalRevenue = (transactionsRes.data ?? []).reduce((sum, row) => {
    const n = Number.parseFloat(String(row.amount));
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);

  const allTimeVisitors = new Set<string>();
  const pageViewSessions = new Map<string, number>();
  const sessionPageViews = new Map<string, Set<string>>();

  for (const row of events) {
    if (row.event_name === "page_view" || row.event_name === "tool_use") {
      allTimeVisitors.add(visitorKey(row));
    }
    if (row.event_name === "page_view") {
      const key = row.session_id;
      pageViewSessions.set(key, (pageViewSessions.get(key) ?? 0) + 1);
      const paths = sessionPageViews.get(key) ?? new Set<string>();
      paths.add(row.path ?? "/");
      sessionPageViews.set(key, paths);
    }
  }

  const totalVisitors = allTimeVisitors.size;

  const signupEvents = events.filter((e) => e.event_name === "auth_signup").length;
  const profileCount = profilesRes.data?.length ?? 0;
  const signups = signupEvents > 0 ? signupEvents : profileCount;
  const conversionRate =
    totalVisitors > 0 ? Math.round((signups / totalVisitors) * 1000) / 10 : 0;

  const activeSessions24h = new Set(
    events
      .filter((e) => new Date(e.created_at) >= since24h)
      .map((e) => e.session_id),
  ).size;

  let bouncedSessions = 0;
  for (const [, paths] of sessionPageViews) {
    if (paths.size <= 1) bouncedSessions += 1;
  }
  const bounceRate =
    sessionPageViews.size > 0
      ? Math.round((bouncedSessions / sessionPageViews.size) * 1000) / 10
      : 0;

  const searchQueries = events.filter((e) => e.event_name === "search").length;

  const dailyVisitors = new Map<string, Set<string>>();
  for (const row of events) {
    if (row.event_name !== "page_view") continue;
    const day = formatDateKey(row.created_at);
    const set = dailyVisitors.get(day) ?? new Set<string>();
    set.add(visitorKey(row));
    dailyVisitors.set(day, set);
  }

  const trafficGrowth: { date: string; visitors: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = formatDateKey(d.toISOString());
    trafficGrowth.push({
      date: key,
      visitors: dailyVisitors.get(key)?.size ?? 0,
    });
  }

  let guestVisits = 0;
  let loggedInVisits = 0;
  for (const row of events) {
    if (row.event_name !== "page_view") continue;
    if (row.user_id) loggedInVisits += 1;
    else guestVisits += 1;
  }

  const toolCounts = new Map<string, number>();
  for (const row of events) {
    if (row.event_name !== "tool_use" || !row.tool_slug) continue;
    toolCounts.set(row.tool_slug, (toolCounts.get(row.tool_slug) ?? 0) + 1);
  }

  const toolPopularity = [...toolCounts.entries()]
    .map(([slug, count]) => ({
      slug,
      name: getToolBySlug(slug)?.name ?? slug,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

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
    summary: {
      totalVisitors,
      conversionRate,
      activeSessions24h,
      totalRevenue: formatInr(totalRevenue),
      bounceRate,
      searchQueries,
    },
    trafficGrowth,
    authStats: { guest: guestVisits, loggedIn: loggedInVisits },
    toolPopularity,
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

function emptyStats(): AdminAnalyticsStats {
  const trafficGrowth: { date: string; visitors: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    trafficGrowth.push({ date: formatDateKey(d.toISOString()), visitors: 0 });
  }
  return {
    summary: {
      totalVisitors: 0,
      conversionRate: 0,
      activeSessions24h: 0,
      totalRevenue: 0,
      bounceRate: 0,
      searchQueries: 0,
    },
    trafficGrowth,
    authStats: { guest: 0, loggedIn: 0 },
    toolPopularity: [],
    recentEvents: [],
  };
}
