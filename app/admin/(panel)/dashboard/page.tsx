import type { Metadata } from "next";
import { ArrowRight, BarChart3, Lock, TrendingUp, Users } from "lucide-react";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/admin-page-header";

export const metadata: Metadata = {
  title: "Admin dashboard",
  robots: { index: false, follow: false },
};

const QUICK_LINKS = [
  {
    href: "/admin/analytics",
    title: "Analytics",
    description: "Visitors, revenue, tool usage, and live events.",
    icon: BarChart3,
    accent: "bg-indigo-50 text-indigo-600 border-indigo-100",
  },
] as const;

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Overview"
        description="Welcome back. Use the sidebar to navigate or jump into analytics below."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Status</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">Session active</p>
              <p className="mt-1 text-sm text-slate-500">Expires after 2h inactivity</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50">
              <Lock className="h-5 w-5 text-emerald-600" aria-hidden />
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Insights</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">Real-time data</p>
              <p className="mt-1 text-sm text-slate-500">Traffic, auth, and tool metrics</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-100 bg-slate-50">
              <TrendingUp className="h-5 w-5 text-slate-600" aria-hidden />
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2 xl:col-span-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Audience</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">Visitor tracking</p>
              <p className="mt-1 text-sm text-slate-500">Page views and conversions</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-100 bg-slate-50">
              <Users className="h-5 w-5 text-slate-600" aria-hidden />
            </span>
          </div>
        </div>
      </div>

      <section>
        <h3 className="mb-4 text-sm font-semibold text-slate-900">Quick actions</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {QUICK_LINKS.map(({ href, title, description, icon: Icon, accent }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${accent}`}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900 group-hover:text-indigo-700">{title}</p>
                <p className="mt-1 text-sm text-slate-500">{description}</p>
              </div>
              <ArrowRight
                className="mt-1 h-5 w-5 shrink-0 text-slate-300 transition group-hover:text-indigo-500"
                aria-hidden
              />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
