"use client";

import { format, formatDistanceToNow } from "date-fns";
import {
  Activity,
  BarChart3,
  MousePointerClick,
  Percent,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { AdminAnalyticsStats } from "@/actions/get-admin-stats";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

type AdminAnalyticsDashboardProps = {
  initialStats: AdminAnalyticsStats;
};

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

export function AdminAnalyticsDashboard({ initialStats }: AdminAnalyticsDashboardProps) {
  const router = useRouter();
  const [stats, setStats] = useState(initialStats);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setStats(initialStats);
  }, [initialStats]);

  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  const trafficChart = stats.trafficGrowth.map((d) => ({
    ...d,
    label: format(new Date(`${d.date}T12:00:00`), "MMM d"),
  }));

  const authChart = [
    { name: "Guest visits", value: stats.authStats.guest, fill: "#94a3b8" },
    { name: "Logged-in", value: stats.authStats.loggedIn, fill: "#4f46e5" },
  ];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Analytics"
        description="Visitors, auth, tool usage, and revenue — last 30 days."
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <SummaryCard
          label="Total visitors"
          value={stats.summary.totalVisitors.toLocaleString()}
          hint="Unique users + sessions (30d)"
          icon={Users}
        />
        <SummaryCard
          label="Conversion rate"
          value={`${stats.summary.conversionRate}%`}
          hint="Sign-ups vs unique visitors"
          icon={Percent}
        />
        <SummaryCard
          label="Active sessions"
          value={stats.summary.activeSessions24h.toLocaleString()}
          hint="Events in last 24 hours"
          icon={Activity}
        />
        <SummaryCard
          label="Total revenue"
          value={formatInr(stats.summary.totalRevenue)}
          hint="Captured transactions"
          icon={Wallet}
        />
        <SummaryCard
          label="Bounce rate"
          value={`${stats.summary.bounceRate}%`}
          hint="Single-page sessions"
          icon={MousePointerClick}
        />
        <SummaryCard
          label="Tool searches"
          value={stats.summary.searchQueries.toLocaleString()}
          hint="Search bar in tool grid"
          icon={Search}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title="Traffic growth"
          description="Daily unique visitors — last 30 days"
          icon={TrendingUp}
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trafficChart} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: TICK_FILL, fontSize: 11 }}
                  axisLine={{ stroke: GRID_STROKE }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: TICK_FILL, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#0f172a" }} />
                <Line
                  type="monotone"
                  dataKey="visitors"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#4f46e5" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Auth stats"
          description="Guest visits vs logged-in page views (30d)"
          icon={BarChart3}
        >
          <div className="h-72 w-full">
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
        description="Successful tool runs (downloads / exports) — 30d"
        icon={BarChart3}
      >
        {stats.toolPopularity.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">No tool usage recorded yet.</p>
        ) : (
          <div
            className="w-full"
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
          <p className="mt-0.5 text-xs text-slate-500">Last 20 events — refresh to update</p>
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
