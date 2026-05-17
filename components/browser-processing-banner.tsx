"use client";

import { Loader2, Shield } from "lucide-react";

type BrowserProcessingBannerProps = {
  active: boolean;
  message?: string;
  progress?: number | null;
  detail?: string;
};

export function BrowserProcessingBanner({
  active,
  message = "Processing securely in your browser…",
  progress = null,
  detail,
}: BrowserProcessingBannerProps) {
  if (!active) return null;

  return (
    <div
      className="rounded-xl border border-[#251EFF]/30 bg-[#251EFF]/5 px-4 py-3"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-[#251EFF]" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Shield className="h-4 w-4 text-[#251EFF]" aria-hidden />
            {message}
          </p>
          {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
          {progress !== null ? (
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-[#251EFF] transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
