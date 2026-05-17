"use client";

import { format } from "date-fns";
import { ArrowRight, FileStack, Sparkles, User } from "lucide-react";
import Link from "next/link";

import {
  AccountCard,
  AccountCardContent,
  AccountCardHeader,
  AccountCardLabel,
  AccountPanel,
  CardTitle,
} from "@/components/account/account-card";
import { PassExpiryCountdown } from "@/components/account/pass-expiry-countdown";
import { Button } from "@/components/ui/button";
import { planDisplayName } from "@/lib/account/plan-labels";

type AccountOverviewClientProps = {
  email: string;
  memberSinceIso: string | null;
  planType: string;
  accessUntilIso: string | null;
  isPaid: boolean;
  totalFilesProcessed: number;
  mostUsedTool: string | null;
};

export function AccountOverviewClient({
  email,
  memberSinceIso,
  planType,
  accessUntilIso,
  isPaid,
  totalFilesProcessed,
  mostUsedTool,
}: AccountOverviewClientProps) {
  const memberSince =
    memberSinceIso && !Number.isNaN(new Date(memberSinceIso).getTime())
      ? format(new Date(memberSinceIso), "MMMM yyyy")
      : "—";

  return (
    <div className="space-y-10 lg:space-y-12">
      <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-3">
        <AccountCard className="flex h-full flex-col">
          <AccountCardHeader>
            <AccountCardLabel icon={User}>Identity</AccountCardLabel>
            <CardTitle className="break-all text-lg font-semibold leading-snug text-foreground">
              {email}
            </CardTitle>
          </AccountCardHeader>
          <AccountCardContent className="mt-auto">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Member since <span className="font-medium text-foreground">{memberSince}</span>
            </p>
          </AccountCardContent>
        </AccountCard>

        <AccountCard className="flex h-full flex-col">
          <AccountCardHeader>
            <AccountCardLabel icon={Sparkles}>Active status</AccountCardLabel>
            <CardTitle className="text-2xl font-bold leading-tight text-foreground sm:text-[1.65rem]">
              {isPaid ? `${planDisplayName(planType)} Active` : "Free Plan"}
            </CardTitle>
          </AccountCardHeader>
          <AccountCardContent className="mt-auto">
            {isPaid && accessUntilIso ? (
              <PassExpiryCountdown
                accessUntilIso={accessUntilIso}
                className="text-sm font-medium text-[#251EFF]"
              />
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Upgrade for unlimited Pro tools.
              </p>
            )}
          </AccountCardContent>
        </AccountCard>

        <AccountCard className="flex h-full flex-col">
          <AccountCardHeader>
            <AccountCardLabel icon={FileStack}>Quick stats</AccountCardLabel>
          </AccountCardHeader>
          <AccountCardContent className="mt-auto space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Total files processed:{" "}
              <span className="font-semibold text-foreground">{totalFilesProcessed}</span>
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Most used tool:{" "}
              <span className="font-semibold text-foreground">{mostUsedTool ?? "—"}</span>
            </p>
          </AccountCardContent>
        </AccountCard>
      </div>

      <AccountPanel title="Actions">
        <ul className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <li className="w-full sm:w-auto">
            <Button
              asChild
              variant="outline"
              className="h-11 w-full min-w-[11rem] border-border sm:w-auto"
            >
              <Link href="/profile">Update profile</Link>
            </Button>
          </li>
          <li className="w-full sm:w-auto">
            <Button
              asChild
              variant="outline"
              className="h-11 w-full min-w-[11rem] border-border sm:w-auto"
            >
              <Link href="/subscription">Manage billing</Link>
            </Button>
          </li>
          <li className="w-full sm:w-auto">
            <Button
              asChild
              className="h-11 w-full min-w-[11rem] bg-black text-white hover:bg-zinc-800 sm:w-auto"
            >
              <Link href="/#tools">
                Go to tools
                <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </li>
        </ul>
      </AccountPanel>
    </div>
  );
}
