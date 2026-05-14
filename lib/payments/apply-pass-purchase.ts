import type { SupabaseClient } from "@supabase/supabase-js";

import type { PassId } from "@/lib/pricing-passes";
import type { Database } from "@/types/database";

import { computeAccessUntil } from "./access-until";

export type ApplyPassPurchaseParams = {
  userId: string;
  orderId: string;
  paymentId: string | null;
  planId: PassId;
  /** Stored in `transactions.amount` as INR (rupees), not paisa. */
  amountRupees: number;
};

/**
 * Idempotent grant: one row per `order_id`. Safe for client verify + webhook racing.
 */
export async function applyPassPurchase(
  supabase: SupabaseClient<Database>,
  params: ApplyPassPurchaseParams,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: existing } = await supabase
    .from("transactions")
    .select("id")
    .eq("order_id", params.orderId)
    .maybeSingle();

  if (existing) {
    return { ok: true };
  }

  const { data: profile, error: profileReadError } = await supabase
    .from("profiles")
    .select("access_until")
    .eq("id", params.userId)
    .maybeSingle();

  if (profileReadError) {
    return { ok: false, error: profileReadError.message };
  }

  const accessUntil = computeAccessUntil(profile?.access_until, params.planId).toISOString();

  const { error: insertError } = await supabase.from("transactions").insert({
    user_id: params.userId,
    order_id: params.orderId,
    payment_id: params.paymentId,
    amount: String(params.amountRupees),
    status: "captured",
    plan_selected: params.planId,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return { ok: true };
    }
    return { ok: false, error: insertError.message };
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      plan_type: params.planId,
      access_until: accessUntil,
    })
    .eq("id", params.userId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  return { ok: true };
}
