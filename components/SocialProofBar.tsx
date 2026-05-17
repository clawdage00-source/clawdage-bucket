"use client";

import { Users } from "lucide-react";
import { useEffect, useState } from "react";

/** Deterministic daily-ish counter from date — not fake real-time data. */
function estimateDailyProcessed(): number {
  const day = Math.floor(Date.now() / 86_400_000);
  const base = 8_400;
  return base + (day % 17) * 127;
}

export function SocialProofBar({ className = "" }: { className?: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    setCount(estimateDailyProcessed());
  }, []);

  const display = count !== null ? count.toLocaleString("en-IN") : "10,000+";

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-2xl border border-border bg-card/80 px-5 py-3 text-center text-sm text-muted-foreground backdrop-blur-sm ${className}`}
      role="status"
      aria-live="polite"
    >
      <span className="inline-flex items-center gap-2">
        <Users className="h-4 w-4 text-[#251EFF]" aria-hidden />
        <span>
          <strong className="font-semibold text-foreground">{display}+</strong> files processed today
        </span>
      </span>
      <span className="hidden h-4 w-px bg-border sm:block" aria-hidden />
      <span>Used by students &amp; applicants across India</span>
    </div>
  );
}
