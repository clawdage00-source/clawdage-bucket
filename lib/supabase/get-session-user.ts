import type { User } from "@supabase/supabase-js";

import { getSupabaseEnv } from "./env";
import { createClient } from "./server";

/** Safe for layout: no throw when Supabase env is missing or session is absent. */
export async function getSessionUser(): Promise<User | null> {
  if (!getSupabaseEnv().ok) {
    return null;
  }
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) {
      return null;
    }
    return user;
  } catch {
    return null;
  }
}
