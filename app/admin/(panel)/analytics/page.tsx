import type { Metadata } from "next";

import { getAdminStats } from "@/actions/get-admin-stats";
import { AdminAnalyticsDashboard } from "@/components/admin/admin-analytics-dashboard";

export const metadata: Metadata = {
  title: "Admin analytics",
  robots: { index: false, follow: false },
};

export default async function AdminAnalyticsPage() {
  const stats = await getAdminStats();
  return <AdminAnalyticsDashboard initialStats={stats} />;
}
