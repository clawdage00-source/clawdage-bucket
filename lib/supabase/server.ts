import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/types/database";

import { getSupabaseEnv } from "./env";

/**
 * Server Supabase client for Server Components, Route Handlers, and Server Actions.
 */
export async function createClient() {
  const env = getSupabaseEnv();
  if (!env.ok) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[supabase/server] ${env.message}`);
    }
    throw new Error(`[supabase/server] ${env.message}`);
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component without mutable cookies; middleware should refresh the session.
        }
      },
    },
  });
}
