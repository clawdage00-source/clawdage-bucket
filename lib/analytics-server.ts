import type { Json } from "@/types/database";

import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function trackServerAnalyticsEvent(params: {
  eventName: string;
  userId?: string | null;
  sessionId: string;
  toolSlug?: string | null;
  path?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, Json | undefined>;
}): Promise<void> {
  const admin = createServiceRoleClient();
  if (!admin) return;

  const { error } = await admin.from("analytics_events").insert({
    event_name: params.eventName,
    tool_slug: params.toolSlug ?? null,
    user_id: params.userId ?? null,
    session_id: params.sessionId,
    user_agent: params.userAgent ?? null,
    path: params.path ?? null,
    metadata: (params.metadata ?? {}) as Json,
  });

  if (error && process.env.NODE_ENV === "development") {
    console.warn("[analytics-server] insert failed", error.message);
  }
}
