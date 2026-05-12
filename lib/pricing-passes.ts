export type PassId = "daily" | "weekly" | "monthly" | "yearly";

export type PassOption = {
  id: PassId;
  name: string;
  price: number;
  currency: string;
  description: string;
  tag: string | null;
  /** Weekly pass is visually highlighted */
  popular?: boolean;
};

export const PAID_PASS_FEATURES = [
  "Unlimited file conversions.",
  "Access to all PRO tools (Background Remover, OCR, Passport Maker).",
  "No Ads & Priority Processing.",
  "One-time payment (No Auto-debit).",
] as const;

export const PASS_OPTIONS: PassOption[] = [
  {
    id: "daily",
    name: "Daily Pass",
    price: 19,
    currency: "₹",
    description: "Perfect for a single project.",
    tag: "Best for Students",
  },
  {
    id: "weekly",
    name: "Weekly Pass",
    price: 79,
    currency: "₹",
    description: "Unlimited access for 7 days.",
    tag: "Most Popular",
    popular: true,
  },
  {
    id: "monthly",
    name: "Monthly Pass",
    price: 199,
    currency: "₹",
    description: "For freelancers and power users.",
    tag: null,
  },
  {
    id: "yearly",
    name: "Yearly Pass",
    price: 999,
    currency: "₹",
    description: "Best value for long-term use.",
    tag: "Savings",
  },
];
