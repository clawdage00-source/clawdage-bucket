"use client";

import { format } from "date-fns";
import { CheckCircle, Download } from "lucide-react";
import Link from "next/link";

import {
  AccountCard,
  AccountCardContent,
  AccountCardHeader,
  AccountPanel,
  AccountSection,
  CardTitle,
} from "@/components/account/account-card";
import { PassExpiryCountdown } from "@/components/account/pass-expiry-countdown";
import { SubscriptionCheckoutSection } from "@/components/subscription-checkout-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { planDisplayName } from "@/lib/account/plan-labels";
import { FREE_DAILY_TASK_LIMIT, type TransactionRow } from "@/lib/account/types";

type SubscriptionClientProps = {
  userEmail: string;
  userName: string;
  planType: string;
  accessUntilIso: string | null;
  isPaid: boolean;
  freeTasksUsedToday: number;
  transactions: TransactionRow[];
  showPaymentSuccess: boolean;
};

function formatTxStatus(status: string): {
  label: string;
  variant: "default" | "outline" | "destructive";
} {
  const s = status.toLowerCase();
  if (s === "captured" || s === "success" || s === "paid") {
    return { label: "Success", variant: "default" };
  }
  if (s === "failed") {
    return { label: "Failed", variant: "destructive" };
  }
  return { label: status, variant: "outline" };
}

export function SubscriptionClient({
  userEmail,
  userName,
  planType,
  accessUntilIso,
  isPaid,
  freeTasksUsedToday,
  transactions,
  showPaymentSuccess,
}: SubscriptionClientProps) {
  const freeRemaining = Math.max(0, FREE_DAILY_TASK_LIMIT - freeTasksUsedToday);
  const freePct = Math.round((freeRemaining / FREE_DAILY_TASK_LIMIT) * 100);

  const accessUntilFormatted =
    accessUntilIso && !Number.isNaN(new Date(accessUntilIso).getTime())
      ? format(new Date(accessUntilIso), "MMMM d, yyyy 'at' h:mm a")
      : null;

  return (
    <div className="space-y-10 lg:space-y-12">
      {showPaymentSuccess ? (
        <div className="flex items-start gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 sm:px-6 sm:py-5">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden />
          <div className="space-y-1">
            <p className="font-semibold text-emerald-950">Payment successful</p>
            <p className="text-sm leading-relaxed text-emerald-900/90">
              Your pass is active. Enjoy Pro tools instantly.
            </p>
          </div>
        </div>
      ) : null}

      <AccountCard>
        <AccountCardHeader>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current plan</p>
          <CardTitle className="text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
            {isPaid ? planDisplayName(planType) : "Free Plan"}
          </CardTitle>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            We believe in fairness. You only pay for what you use. Your passes never auto-renew.
          </p>
        </AccountCardHeader>
        <AccountCardContent className="space-y-4">
          {isPaid && accessUntilIso ? (
            <>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Access until{" "}
                <span className="font-semibold text-foreground">{accessUntilFormatted}</span>
              </p>
              <PassExpiryCountdown
                accessUntilIso={accessUntilIso}
                className="text-base font-semibold text-[#251EFF]"
              />
            </>
          ) : (
            <>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {freeRemaining} of {FREE_DAILY_TASK_LIMIT} free daily tasks remaining
              </p>
              <div className="h-2.5 w-full max-w-md overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#251EFF] transition-[width]"
                  style={{ width: `${freePct}%` }}
                />
              </div>
            </>
          )}
        </AccountCardContent>
      </AccountCard>

      <AccountSection
        title="Transaction history"
        description="Receipts for passes purchased on this account."
      >
        {transactions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-6 py-10 text-center text-sm leading-relaxed text-muted-foreground">
            No transactions yet. Your first pass will appear here.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="h-12 px-4 text-muted-foreground sm:px-6">Date</TableHead>
                  <TableHead className="h-12 px-4 text-muted-foreground sm:px-6">Plan</TableHead>
                  <TableHead className="h-12 px-4 text-muted-foreground sm:px-6">Amount</TableHead>
                  <TableHead className="h-12 px-4 text-muted-foreground sm:px-6">Status</TableHead>
                  <TableHead className="h-12 px-4 text-right text-muted-foreground sm:px-6">Invoice</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => {
                  const status = formatTxStatus(tx.status);
                  return (
                    <TableRow key={tx.id} className="border-border">
                      <TableCell className="px-4 py-4 text-muted-foreground sm:px-6">
                        {tx.created_at
                          ? format(new Date(tx.created_at), "MMM d, yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell className="px-4 py-4 font-medium text-foreground sm:px-6">
                        {planDisplayName(tx.plan_selected)}
                      </TableCell>
                      <TableCell className="px-4 py-4 font-medium text-foreground sm:px-6">
                        ₹{Number(tx.amount).toFixed(0)}
                      </TableCell>
                      <TableCell className="px-4 py-4 sm:px-6">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right sm:px-6">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground"
                          disabled
                          title="Invoice download coming soon"
                        >
                          <Download className="h-4 w-4" aria-hidden />
                          <span className="sr-only">Download invoice</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </AccountSection>

      <AccountPanel
        title="Renew or upgrade"
        description="Need more time? Pick a pass below or compare plans on pricing."
      >
        <Button asChild className="h-11 bg-black px-6 text-white hover:bg-zinc-800">
          <Link href="/pricing">View all plans</Link>
        </Button>
      </AccountPanel>

      <section className="space-y-6 border-t border-border pt-10 lg:pt-12">
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Buy a pass</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            One-time payment. No auto-debit. Unlocks Pro tools immediately.
          </p>
        </div>
        <SubscriptionCheckoutSection userEmail={userEmail} userName={userName} />
      </section>
    </div>
  );
}
