"use client";

import type { Json } from "@/types/database";

import { createClient } from "@/lib/supabase/client";
import { getSupabaseEnv } from "@/lib/supabase/env";

const SESSION_KEY = "clawdage_analytics_session";

export type AnalyticsEventName =
  | "page_view"
  | "tool_use"
  | "search"
  | "auth_login"
  | "auth_signup";

export type AnalyticsMetadata = Record<string, Json | undefined>;

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "server";
  try {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `s_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return `s_${Date.now()}`;
  }
}

export function parseUserAgent(ua: string): { browser: string; os: string } {
  const lower = ua.toLowerCase();
  let browser = "Other";
  if (lower.includes("edg/")) browser = "Edge";
  else if (lower.includes("chrome/") && !lower.includes("chromium")) browser = "Chrome";
  else if (lower.includes("firefox/")) browser = "Firefox";
  else if (lower.includes("safari/") && !lower.includes("chrome")) browser = "Safari";

  let os = "Other";
  if (lower.includes("windows")) os = "Windows";
  else if (lower.includes("mac os") || lower.includes("macintosh")) os = "macOS";
  else if (lower.includes("android")) os = "Android";
  else if (lower.includes("iphone") || lower.includes("ipad")) os = "iOS";
  else if (lower.includes("linux")) os = "Linux";

  return { browser, os };
}

/**
 * Fire-and-forget client analytics. Inserts into `analytics_events` via Supabase anon client.
 */
export async function trackEvent(
  eventName: AnalyticsEventName | string,
  toolSlug?: string,
  metadata?: AnalyticsMetadata,
): Promise<void> {
  if (typeof window === "undefined") return;

  // Skip quietly when Supabase isn't configured (common in local .env.local).
  if (!getSupabaseEnv().ok) return;

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const ua = navigator.userAgent;
    const { browser, os } = parseUserAgent(ua);

    const row = {
      event_name: eventName,
      tool_slug: toolSlug ?? null,
      user_id: user?.id ?? null,
      session_id: getOrCreateSessionId(),
      user_agent: ua,
      path: window.location.pathname,
      metadata: {
        browser,
        os,
        ...metadata,
      } as Json,
    };

    const { error } = await supabase.from("analytics_events").insert(row);
    if (error && process.env.NODE_ENV === "development") {
      console.warn("[analytics] insert failed", error.message);
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[analytics] trackEvent error", err);
    }
  }
}

/** Shorthand for successful tool execution / download. */
export function trackToolUse(toolSlug: string, metadata?: AnalyticsMetadata): void {
  void trackEvent("tool_use", toolSlug, metadata);
}
