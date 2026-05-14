"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { applyPassPurchase } from "@/lib/payments/apply-pass-purchase";
import { verifyRazorpayPaymentSignature } from "@/lib/payments/verify-signature";
import { PASS_OPTIONS, type PassId } from "@/lib/pricing-passes";
import { createRazorpayClient, getRazorpayEnv } from "@/lib/razorpay/server";

const PASS_IDS = new Set<PassId>(PASS_OPTIONS.map((p) => p.id));

function isPassId(value: string): value is PassId {
  return PASS_IDS.has(value as PassId);
}

function amountPaisaForPlan(planId: PassId): number {
  const pass = PASS_OPTIONS.find((p) => p.id === planId);
  if (!pass) {
    throw new Error("Invalid plan");
  }
  return pass.price * 100;
}

export type CreateOrderResult =
  | { ok: true; orderId: string; amount: number; currency: string; keyId: string }
  | { ok: false; error: string };

/**
 * Creates a Razorpay order. Amount is always derived from `planId` on the server (INR, paisa).
 */
export async function createOrder(planId: string): Promise<CreateOrderResult> {
  if (!isPassId(planId)) {
    return { ok: false, error: "Invalid plan." };
  }

  const rzEnv = getRazorpayEnv();
  if (!rzEnv.ok) {
    return { ok: false, error: rzEnv.message };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { ok: false, error: "You must be signed in to purchase a pass." };
  }

  const razorpay = createRazorpayClient();
  if (!razorpay) {
    return { ok: false, error: "Payment provider is not configured." };
  }

  const amount = amountPaisaForPlan(planId);

  try {
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `pass_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: {
        user_id: user.id,
        plan_id: planId,
      },
    });

    return {
      ok: true,
      orderId: order.id,
      amount: Number(order.amount),
      currency: order.currency,
      keyId: rzEnv.keyId,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not create order.";
    return { ok: false, error: message };
  }
}

export type RazorpayCheckoutResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type VerifyPaymentResult = { ok: true } | { ok: false; error: string };

/**
 * Verifies `razorpay_signature` and, if valid, grants the pass and records the transaction.
 */
export async function verifyPayment(response: RazorpayCheckoutResponse): Promise<VerifyPaymentResult> {
  const rzEnv = getRazorpayEnv();
  if (!rzEnv.ok) {
    return { ok: false, error: rzEnv.message };
  }

  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } =
    response;

  if (!orderId || !paymentId || !signature) {
    return { ok: false, error: "Missing payment fields." };
  }

  if (!verifyRazorpayPaymentSignature(orderId, paymentId, signature, rzEnv.keySecret)) {
    return { ok: false, error: "Invalid payment signature." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { ok: false, error: "Not signed in." };
  }

  const razorpay = createRazorpayClient();
  if (!razorpay) {
    return { ok: false, error: "Payment provider is not configured." };
  }

  let orderNotes: Record<string, string> = {};
  let orderAmountPaisa = 0;
  try {
    const order = await razorpay.orders.fetch(orderId);
    orderNotes = (order.notes ?? {}) as Record<string, string>;
    orderAmountPaisa = Number(order.amount);
  } catch {
    return { ok: false, error: "Could not load order details." };
  }

  const noteUserId = orderNotes.user_id;
  const planRaw = orderNotes.plan_id;
  if (!noteUserId || noteUserId !== user.id) {
    return { ok: false, error: "Order does not belong to this account." };
  }
  if (!planRaw || !isPassId(planRaw)) {
    return { ok: false, error: "Invalid order metadata." };
  }

  const expectedPaisa = amountPaisaForPlan(planRaw);
  if (orderAmountPaisa !== expectedPaisa) {
    return { ok: false, error: "Order amount mismatch." };
  }

  const amountRupees = expectedPaisa / 100;

  const applied = await applyPassPurchase(supabase, {
    userId: user.id,
    orderId,
    paymentId,
    planId: planRaw,
    amountRupees,
  });

  if (!applied.ok) {
    return { ok: false, error: applied.error };
  }

  revalidatePath("/profile");
  revalidatePath("/subscription");
  revalidatePath("/pricing");
  revalidatePath("/", "layout");

  return { ok: true };
}

/**
 * Used by the Razorpay webhook when the browser never calls `verifyPayment`.
 * Requires service role to bypass RLS (no user session on webhooks).
 */
export async function grantPassFromVerifiedPayment(params: {
  userId: string;
  orderId: string;
  paymentId: string | null;
  planId: PassId;
  amountRupees: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createServiceRoleClient();
  if (!admin) {
    return { ok: false, error: "Server database client is not configured." };
  }
  return applyPassPurchase(admin, {
    userId: params.userId,
    orderId: params.orderId,
    paymentId: params.paymentId,
    planId: params.planId,
    amountRupees: params.amountRupees,
  });
}
