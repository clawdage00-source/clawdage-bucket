"use client";

import { LOCALES } from "@/lib/i18n/config";

/** UI foundation — full translations ship in a later release */
export function LanguageSwitcher() {
  return (
    <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
      <span className="sr-only">Language</span>
      <select
        className="rounded-lg border border-border bg-card px-2 py-1 text-xs text-foreground"
        defaultValue="en"
        disabled
        title="Regional languages coming soon"
        aria-label="Language (coming soon)"
      >
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.nativeLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
