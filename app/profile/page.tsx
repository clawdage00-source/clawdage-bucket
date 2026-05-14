import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProfilePageClient } from "@/components/profile-page-client";
import { getSessionUser } from "@/lib/supabase/get-session-user";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your plan, transactions, and account settings.",
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?redirectedFrom=/profile");
  }

  let planType = "free";
  let accessUntilIso: string | null = null;
  const transactions: Array<{
    id: string;
    order_id: string;
    payment_id: string | null;
    amount: string;
    status: string;
    plan_selected: string;
    created_at: string | null;
  }> = [];

  try {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan_type, access_until")
      .eq("id", user.id)
      .maybeSingle();

    planType = profile?.plan_type ?? "free";
    accessUntilIso = profile?.access_until ?? null;

    const { data: txRows } = await supabase
      .from("transactions")
      .select("id, order_id, payment_id, amount, status, plan_selected, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (txRows) {
      transactions.push(...txRows);
    }
  } catch {
    // Supabase not configured or network error — still render shell with defaults.
  }

  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const initialFullName =
    (typeof meta?.full_name === "string" && meta.full_name) ||
    (typeof meta?.name === "string" && meta.name) ||
    "";
  const initialAvatarUrl =
    (typeof meta?.avatar_url === "string" && meta.avatar_url) ||
    (typeof meta?.picture === "string" && meta.picture) ||
    "";

  const showPaymentSuccess = params.status === "success";

  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="border-b border-slate-200 bg-white px-6 py-10 sm:py-12">
        <h1 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight text-black">Profile</h1>
        <p className="mx-auto mt-2 max-w-3xl text-sm text-slate-600">Passes, billing history, and preferences.</p>
      </div>
      <ProfilePageClient
        email={user.email ?? ""}
        initialFullName={initialFullName}
        initialAvatarUrl={initialAvatarUrl}
        planType={planType}
        accessUntilIso={accessUntilIso}
        transactions={transactions}
        showPaymentSuccess={showPaymentSuccess}
      />
    </div>
  );
}
