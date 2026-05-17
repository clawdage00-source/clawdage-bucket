"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { trackEvent } from "@/lib/analytics";

/** Tracks SPA navigations and initial page load. Skip admin routes. */
export function AnalyticsRoot() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    void trackEvent("page_view", undefined, { referrer: document.referrer || null });

    const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
    if (gaId && typeof window.gtag === "function") {
      window.gtag("config", gaId, { page_path: pathname });
    }
  }, [pathname]);

  return null;
}
