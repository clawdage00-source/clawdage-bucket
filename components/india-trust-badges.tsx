import { GraduationCap, Landmark, Lock, Smartphone, Stamp } from "lucide-react";

import { cn } from "@/lib/utils";

const BADGES = [
  { icon: GraduationCap, label: "SSC Compatible" },
  { icon: Landmark, label: "UPSC Ready" },
  { icon: Stamp, label: "Govt Portal Friendly" },
  { icon: Stamp, label: "Passport Accepted" },
  { icon: Smartphone, label: "Mobile Friendly" },
  { icon: Lock, label: "Privacy Safe" },
] as const;

type IndiaTrustBadgesProps = {
  className?: string;
  compact?: boolean;
};

export function IndiaTrustBadges({ className = "", compact = false }: IndiaTrustBadgesProps) {
  return (
    <ul
      className={cn("flex flex-wrap gap-2", className)}
      aria-label="Popular in India trust badges"
    >
      {BADGES.map(({ icon: Icon, label }) => (
        <li
          key={label}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-border bg-card font-medium text-muted-foreground",
            compact ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-xs",
          )}
        >
          <Icon className={cn("shrink-0 text-[#251EFF]", compact ? "h-3 w-3" : "h-3.5 w-3.5")} aria-hidden />
          {label}
        </li>
      ))}
    </ul>
  );
}
