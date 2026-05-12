import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

import { getSupabaseEnv } from "./env";

/**
 * Browser Supabase client. Throws a clear error if env is missing (avoids opaque runtime failures).
 */
export function createClient() {
  const env = getSupabaseEnv();
  if (!env.ok) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[supabase/client] ${env.message}`);
    }
    throw new Error(`[supabase/client] ${env.message}`);
  }

  return createBrowserClient<Database>(env.url, env.anonKey);
}
