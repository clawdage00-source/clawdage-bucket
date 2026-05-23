import type { Metadata } from "next";
import { Suspense } from "react";

import { getAdminStats, type AdminStatsQuery } from "@/actions/get-admin-stats";
import { AdminAnalyticsDashboard } from "@/components/admin/admin-analytics-dashboard";
import type { AnalyticsPeriod } from "@/lib/admin/analytics-range";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin analytics",
  robots: { index: false, follow: false },
};

const PERIODS: AnalyticsPeriod[] = ["daily", "monthly", "yearly", "custom"];

function parseSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): AdminStatsQuery {
  const raw = searchParams.period;
  const period = (typeof raw === "string" && PERIODS.includes(raw as AnalyticsPeriod)
    ? raw
    : "daily") as AnalyticsPeriod;
  const startDate =
    typeof searchParams.start === "string" ? searchParams.start : undefined;
  const endDate =
    typeof searchParams.end === "string" ? searchParams.end : undefined;
  return { period, startDate, endDate };
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function AnalyticsLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
      Loading analytics…
    </div>
  );
}

export default async function AdminAnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const stats = await getAdminStats(parseSearchParams(params));
  return (
    <Suspense fallback={<AnalyticsLoading />}>
      <AdminAnalyticsDashboard initialStats={stats} />
    </Suspense>
  );
}
