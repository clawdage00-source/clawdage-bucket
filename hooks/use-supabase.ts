"use client";

import { useMemo } from "react";

import { createClient } from "@/lib/supabase/client";

/** Singleton browser client per component tree mount. */
export function useSupabase() {
  return useMemo(() => createClient(), []);
}
