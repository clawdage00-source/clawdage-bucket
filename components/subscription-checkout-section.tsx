"use client";

import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

import { createOrder, verifyPayment, type RazorpayCheckoutResponse } from "@/actions/razorpay";
import { PAID_PASS_FEATURES, PASS_OPTIONS, type PassId } from "@/lib/pricing-passes";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.06 },
  },
};

const cardMotion = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 380, damping: 28 } },
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  /** Absolute HTTPS URL to merchant logo (Razorpay checkout header). */
  image?: string;
  prefill?: { email?: string; name?: string };
  theme?: { color?: string };
  handler: (response: RazorpayCheckoutResponse) => void;
  modal?: { ondismiss?: () => void };
};

type RazorpayCtor = new (options: RazorpayOptions) => { open: () => void };

function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("No window"));
  }
  if ((window as unknown as { Razorpay?: RazorpayCtor }).Razorpay) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Script failed")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Razorpay"));
    document.body.appendChild(script);
  });
}

type SubscriptionCheckoutSectionProps = {
  userEmail: string;
  userName: string;
};

export function SubscriptionCheckoutSection({ userEmail, userName }: SubscriptionCheckoutSectionProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const buy = useCallback(
    (planId: PassId) => {
      setError(null);
      startTransition(async () => {
        try {
          await loadRazorpayScript();
          const Razorpay = (window as unknown as { Razorpay?: RazorpayCtor }).Razorpay;
          if (!Razorpay) {
            setError("Checkout could not load. Try again.");
            return;
          }

          const order = await createOrder(planId);
          if (!order.ok) {
            setError(order.error);
            return;
          }

          const pass = PASS_OPTIONS.find((p) => p.id === planId);
          const checkoutLogoUrl = `${window.location.origin}/web-tab-logo.png`;

          const rzp = new Razorpay({
            key: order.keyId,
            amount: order.amount,
            currency: order.currency,
            name: "Clawdage",
            description: pass?.name ?? "Pass",
            order_id: order.orderId,
            image: checkoutLogoUrl,
            prefill: {
              email: userEmail || undefined,
              name: userName || undefined,
            },
            theme: { color: "#2a1fff" },
            handler: async (response: RazorpayCheckoutResponse) => {
              const verified = await verifyPayment(response);
              if (!verified.ok) {
                setError(verified.error);
                return;
              }
              router.push("/subscription?status=success");
            },
          });
          rzp.open();
        } catch (e) {
          setError(e instanceof Error ? e.message : "Something went wrong.");
        }
      });
    },
    [router, userEmail, userName],
  );

  return (
    <>
      {error ? (
        <div className="mx-auto mb-6 max-w-6xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <motion.div
        className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-6 sm:gap-5 md:grid-cols-2 lg:grid-cols-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {PASS_OPTIONS.map((pass) => (
          <motion.article
            key={pass.id}
            variants={cardMotion}
            className={`relative flex flex-col rounded-2xl border bg-card p-5 text-card-foreground shadow-sm sm:p-6 ${
              pass.popular
                ? "z-[1] border-[#251EFF]/70 ring-2 ring-[#251EFF]/25 shadow-md dark:border-[#251EFF]/50 dark:ring-[#251EFF]/20 lg:scale-[1.02]"
                : "border-border"
            }`}
          >
            {pass.popular ? (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-[#251EFF] bg-[#251EFF] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Popular
              </span>
            ) : null}
            <div className={`mb-3 min-h-[28px] ${pass.popular ? "mt-2" : ""}`}>
              {pass.tag ? (
                <span
                  className={`inline-flex w-fit rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                    pass.popular
                      ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200"
                      : "border-border bg-muted text-muted-foreground"
                  }`}
                >
                  {pass.tag}
                </span>
              ) : !pass.popular ? (
                <span className="block h-[26px]" aria-hidden />
              ) : null}
            </div>

            <h3 className="text-lg font-bold text-foreground">{pass.name}</h3>
            <p className="mt-1 flex items-baseline gap-0.5">
              <span className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {pass.currency}
                {pass.price}
              </span>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{pass.description}</p>
            <ul className="mt-5 flex flex-1 flex-col gap-2.5 border-t border-border pt-5">
              {PAID_PASS_FEATURES.map((line) => (
                <li key={line} className="flex gap-2 text-sm text-muted-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#251EFF] dark:text-[#7c83ff]" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              disabled={isPending}
              onClick={() => buy(pass.id)}
              className="mt-6 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Please wait…
                </>
              ) : (
                "Buy Now"
              )}
            </button>
          </motion.article>
        ))}
      </motion.div>
    </>
  );
}
