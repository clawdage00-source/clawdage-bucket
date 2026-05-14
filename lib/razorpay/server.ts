import Razorpay from "razorpay";

export type RazorpayEnv =
  | { ok: true; keyId: string; keySecret: string }
  | { ok: false; message: string };

export function getRazorpayEnv(): RazorpayEnv {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) {
    return {
      ok: false,
      message:
        "Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET. Add them to the server environment.",
    };
  }
  return { ok: true, keyId, keySecret };
}

export function getRazorpayWebhookSecret(): string | null {
  return process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || null;
}

export function createRazorpayClient(): Razorpay | null {
  const env = getRazorpayEnv();
  if (!env.ok) {
    return null;
  }
  return new Razorpay({
    key_id: env.keyId,
    key_secret: env.keySecret,
  });
}
