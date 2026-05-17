"use client";

import { differenceInCalendarDays, formatDistanceStrict } from "date-fns";
import { useEffect, useState } from "react";

type PassExpiryCountdownProps = {
  accessUntilIso: string;
  className?: string;
};

export function PassExpiryCountdown({ accessUntilIso, className }: PassExpiryCountdownProps) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => {
      const until = new Date(accessUntilIso);
      const now = new Date();
      if (Number.isNaN(until.getTime())) {
        setLabel(null);
        return;
      }
      if (until <= now) {
        setLabel("Expired");
        return;
      }
      const days = differenceInCalendarDays(until, now);
      if (days >= 1) {
        setLabel(`Expires in ${days} day${days === 1 ? "" : "s"}`);
        return;
      }
      setLabel(`Expires in ${formatDistanceStrict(until, now)}`);
    };

    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [accessUntilIso]);

  if (!label) {
    return null;
  }

  return <p className={className}>{label}</p>;
}
