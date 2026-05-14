import { NextResponse } from "next/server";

import { grantPassFromVerifiedPayment } from "@/actions/razorpay";
import { PASS_OPTIONS, type PassId } from "@/lib/pricing-passes";
import { verifyRazorpayWebhookSignature } from "@/lib/payments/verify-signature";
import { createRazorpayClient, getRazorpayWebhookSecret } from "@/lib/razorpay/server";

export const runtime = "nodejs";

const PASS_IDS = new Set<string>(PASS_OPTIONS.map((p) => p.id));

function isPassId(value: string): value is PassId {
  return PASS_IDS.has(value);
}

type RazorpayPaymentEntity = {
  id?: string;
  amount?: number;
  currency?: string;
  order_id?: string | null;
  status?: string;
  notes?: Record<string, string> | null;
};

type RazorpayWebhookBody = {
  event?: string;
  payload?: {
    payment?: {
      entity?: RazorpayPaymentEntity;
    };
  };
};

export async function POST(request: Request) {
  const secret = getRazorpayWebhookSecret();
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const signature = request.headers.get("x-razorpay-signature");
  const rawBody = await request.text();

  if (!verifyRazorpayWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let body: RazorpayWebhookBody;
  try {
    body = JSON.parse(rawBody) as RazorpayWebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.event !== "payment.captured") {
    return NextResponse.json({ received: true });
  }

  const payment = body.payload?.payment?.entity;
  if (!payment || payment.status !== "captured") {
    return NextResponse.json({ received: true });
  }

  const orderId = typeof payment.order_id === "string" ? payment.order_id : null;
  if (!orderId) {
    return NextResponse.json({ received: true });
  }

  const paymentId = typeof payment.id === "string" ? payment.id : null;
  const amountPaisa = typeof payment.amount === "number" ? payment.amount : 0;

  let notes = { ...(payment.notes ?? {}) } as Record<string, string>;

  if (!notes.user_id || !notes.plan_id) {
    const razorpay = createRazorpayClient();
    if (razorpay) {
      try {
        const order = await razorpay.orders.fetch(orderId);
        const orderNotes = (order.notes ?? {}) as Record<string, string>;
        notes = { ...orderNotes, ...notes };
      } catch {
        return NextResponse.json({ error: "Could not resolve order" }, { status: 500 });
      }
    }
  }

  const userId = notes.user_id;
  const planRaw = notes.plan_id;
  if (!userId || !planRaw || !isPassId(planRaw)) {
    return NextResponse.json({ received: true, skipped: "missing_notes" });
  }

  const passOption = PASS_OPTIONS.find((p) => p.id === planRaw);
  if (!passOption) {
    return NextResponse.json({ received: true, skipped: "unknown_plan" });
  }
  const expectedPaisa = passOption.price * 100;
  if (amountPaisa !== expectedPaisa) {
    return NextResponse.json({ received: true, skipped: "amount_mismatch" });
  }

  const amountRupees = amountPaisa / 100;

  const result = await grantPassFromVerifiedPayment({
    userId,
    orderId,
    paymentId,
    planId: planRaw,
    amountRupees,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
