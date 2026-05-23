"use client";

import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  BarChart3,
  CalendarRange,
  Eye,
  MousePointerClick,
  Percent,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { AdminAnalyticsStats } from "@/actions/get-admin-stats";
import type { AnalyticsPeriod } from "@/lib/admin/analytics-range";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

type AdminAnalyticsDashboardProps = {
  initialStats: AdminAnalyticsStats;
};

const PERIOD_OPTIONS: { id: AnalyticsPeriod; label: string }[] = [
  { id: "daily", label: "Daily" },
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
  { id: "custom", label: "Date range" },
];

const CHART_COLORS = ["#4f46e5", "#059669", "#d97706", "#db2777", "#0284c7", "#7c3aed"];
const GRID_STROKE = "#e2e8f0";
const TICK_FILL = "#64748b";
const TOOLTIP_STYLE = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  fontSize: 12,
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.08)",
};

function formatInr(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function SummaryCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-2 truncate text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{hint}</p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50">
          <Icon className="h-5 w-5 text-indigo-600" aria-hidden />
        </span>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-indigo-600" aria-hidden />
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      </div>
      <p className="mb-4 text-xs text-slate-500">{description}</p>
      {children}
    </section>
  );
}

function periodButtonClass(active: boolean): string {
  return `rounded-md px-3 py-1.5 text-sm font-medium transition ${
    active
      ? "bg-indigo-600 text-white shadow-sm"
      : "text-slate-600 hover:bg-slate-100"
  }`;
}

function buildAnalyticsHref(
  period: AnalyticsPeriod,
  start?: string,
  end?: string,
): string {
  const params = new URLSearchParams();
  params.set("period", period);
  if (period === "custom" && start && end) {
    params.set("start", start);
    params.set("end", end);
  }
  return `/admin/analytics?${params.toString()}`;
}

export function AdminAnalyticsDashboard({ initialStats }: AdminAnalyticsDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stats, setStats] = useState(initialStats);
  const [period, setPeriod] = useState<AnalyticsPeriod>(initialStats.query.period);
  const [customStart, setCustomStart] = useState(initialStats.query.startDate);
  const [customEnd, setCustomEnd] = useState(initialStats.query.endDate);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setStats(initialStats);
    setPeriod(initialStats.query.period);
    setCustomStart(initialStats.query.startDate);
    setCustomEnd(initialStats.query.endDate);
    setError(null);
  }, [initialStats]);

  const navigate = useCallback(
    (href: string) => {
      setError(null);
      startTransition(() => {
        router.push(href);
      });
    },
    [router],
  );

  const onPeriodChange = (next: AnalyticsPeriod) => {
    setPeriod(next);
    if (next !== "custom") {
      navigate(buildAnalyticsHref(next));
    }
  };

  const applyCustomRange = () => {
    if (!customStart || !customEnd) {
      setError("Choose both start and end dates.");
      return;
    }
    if (customStart > customEnd) {
      setError("Start date must be on or before end date.");
      return;
    }
    navigate(buildAnalyticsHref("custom", customStart, customEnd));
  };

  const refresh = () => {
    const periodParam = searchParams.get("period") as AnalyticsPeriod | null;
    const startParam = searchParams.get("start") ?? undefined;
    const endParam = searchParams.get("end") ?? undefined;
    const activePeriod =
      periodParam && PERIOD_OPTIONS.some((o) => o.id === periodParam)
        ? periodParam
        : period;
    if (activePeriod === "custom" && startParam && endParam) {
      navigate(buildAnalyticsHref("custom", startParam, endParam));
      return;
    }
    startTransition(() => router.refresh());
  };

  const authChart = [
    { name: "Guest visits", value: stats.authStats.guest, fill: "#94a3b8" },
    { name: "Logged-in", value: stats.authStats.loggedIn, fill: "#4f46e5" },
  ];

  const xInterval =
    stats.trafficGrowth.length > 20
      ? Math.floor(stats.trafficGrowth.length / 8)
      : stats.trafficGrowth.length > 12
        ? 1
        : 0;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Analytics"
        description={stats.query.description}
        actions={
          <button
            type="button"
            onClick={refresh}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} aria-hidden />
            Refresh
          </button>
        }
      />

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Time period
            </p>
            <div className="mt-2 inline-flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  disabled={pending}
                  onClick={() => onPeriodChange(opt.id)}
                  className={periodButtonClass(period === opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {period === "custom" ? (
            <div className="flex flex-wrap items-end gap-3">
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-medium text-slate-500">From</span>
                <input
                  type="date"
                  value={customStart}
                  max={customEnd}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-medium text-slate-500">To</span>
                <input
                  type="date"
                  value={customEnd}
                  min={customStart}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm"
                />
              </label>
              <button
                type="button"
                disabled={pending || !customStart || !customEnd}
                onClick={applyCustomRange}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
              >
                <CalendarRange className="h-4 w-4" aria-hidden />
                Apply range
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              <span className="font-medium text-slate-700">
                {stats.query.startDate}
              </span>
              {" → "}
              <span className="font-medium text-slate-700">{stats.query.endDate}</span>
            </p>
          )}
        </div>
        {error ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        {pending ? (
          <p className="mt-3 text-xs text-slate-500">Loading analytics…</p>
        ) : null}
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        <SummaryCard
          label="Visitors"
          value={stats.summary.totalVisitors.toLocaleString()}
          hint="Unique in selected period"
          icon={Users}
        />
        <SummaryCard
          label="Page views"
          value={stats.summary.pageViews.toLocaleString()}
          hint="In selected period"
          icon={Eye}
        />
        <SummaryCard
          label="Tool uses"
          value={stats.summary.toolUses.toLocaleString()}
          hint="Exports / downloads"
          icon={Wrench}
        />
        <SummaryCard
          label="Revenue"
          value={formatInr(stats.summary.totalRevenue)}
          hint="Captured payments in period"
          icon={Wallet}
        />
        <SummaryCard
          label="Conversion"
          value={`${stats.summary.conversionRate}%`}
          hint={`${stats.summary.signups} sign-ups`}
          icon={Percent}
        />
        <SummaryCard
          label="Sessions (24h)"
          value={stats.summary.activeSessions24h.toLocaleString()}
          hint="Always last 24 hours"
          icon={Activity}
        />
        <SummaryCard
          label="Bounce rate"
          value={`${stats.summary.bounceRate}%`}
          hint="Single-page sessions"
          icon={MousePointerClick}
        />
        <SummaryCard
          label="Searches"
          value={stats.summary.searchQueries.toLocaleString()}
          hint="Tool grid searches"
          icon={Search}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title="Visitors over time"
          description={`Unique visitors — ${stats.query.description}`}
          icon={TrendingUp}
        >
          <div className={`h-72 w-full ${pending ? "opacity-50" : ""}`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.trafficGrowth} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: TICK_FILL, fontSize: 11 }}
                  axisLine={{ stroke: GRID_STROKE }}
                  tickLine={false}
                  interval={xInterval}
                />
                <YAxis
                  tick={{ fill: TICK_FILL, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#0f172a" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="visitors"
                  name="Visitors"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#4f46e5" }}
                />
                <Line
                  type="monotone"
                  dataKey="pageViews"
                  name="Page views"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#059669" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Revenue over time"
          description={`Captured Razorpay payments — ${stats.query.description}`}
          icon={Wallet}
        >
          <div className={`h-72 w-full ${pending ? "opacity-50" : ""}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.revenueGrowth} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: TICK_FILL, fontSize: 11 }}
                  axisLine={{ stroke: GRID_STROKE }}
                  tickLine={false}
                  interval={xInterval}
                />
                <YAxis
                  tick={{ fill: TICK_FILL, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v}`}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value) => [
                    formatInr(typeof value === "number" ? value : Number(value) || 0),
                    "Revenue",
                  ]}
                />
                <Bar dataKey="amount" name="Revenue" fill="#d97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title="Tool activity"
          description={`Tool uses per ${stats.query.granularity} — ${stats.query.description}`}
          icon={BarChart3}
        >
          <div className={`h-72 w-full ${pending ? "opacity-50" : ""}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.trafficGrowth} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: TICK_FILL, fontSize: 11 }}
                  axisLine={{ stroke: GRID_STROKE }}
                  tickLine={false}
                  interval={xInterval}
                />
                <YAxis
                  tick={{ fill: TICK_FILL, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="toolUses" name="Tool uses" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Auth stats"
          description={`Guest vs logged-in page views — ${stats.query.description}`}
          icon={BarChart3}
        >
          <div className={`h-72 w-full ${pending ? "opacity-50" : ""}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={authChart} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
                <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: TICK_FILL, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "#334155", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={108}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={32}>
                  {authChart.map((entry, i) => (
                    <Cell key={entry.name} fill={entry.fill ?? CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard
        title="Tool popularity"
        description={`Top tools in selected period`}
        icon={BarChart3}
      >
        {stats.toolPopularity.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">No tool usage recorded for this period.</p>
        ) : (
          <div
            className={`w-full ${pending ? "opacity-50" : ""}`}
            style={{ height: Math.max(280, stats.toolPopularity.length * 40) }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.toolPopularity}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
              >
                <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: TICK_FILL, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "#334155", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={168}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" fill="#059669" radius={[0, 6, 6, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Live event feed</h2>
          <p className="mt-0.5 text-xs text-slate-500">Last 20 events site-wide — not filtered by date range</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50">
              <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3 font-medium">Time</th>
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Action</th>
                <th className="px-5 py-3 font-medium">Tool</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.recentEvents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-slate-500">
                    No events yet. Browse the site or run a tool to populate data.
                  </td>
                </tr>
              ) : (
                stats.recentEvents.map((row) => (
                  <tr key={row.id} className="text-slate-700 transition hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-500" title={row.time}>
                      {formatDistanceToNow(new Date(row.time), { addSuffix: true })}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">{row.email ?? "—"}</td>
                    <td className="px-5 py-3.5">{row.action}</td>
                    <td className="px-5 py-3.5 text-slate-500">{row.toolName ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
