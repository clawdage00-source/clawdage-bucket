export const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  daily: "Daily Pass",
  weekly: "Weekly Pass",
  monthly: "Monthly Pass",
  yearly: "Yearly Pass",
};

export function planDisplayName(planType: string): string {
  return PLAN_LABELS[planType] ?? planType.replace(/_/g, " ");
}
