export type SupabaseEnv =
  | { ok: true; url: string; anonKey: string }
  | { ok: false; message: string };

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    return Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * Reads public Supabase env vars. Safe to call on server or client.
 * Rejects empty placeholders and malformed URLs so createServerClient never throws on startup.
 */
export function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    return {
      ok: false,
      message:
        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Add them to .env.local (see env.local.template).",
    };
  }

  if (!isValidHttpUrl(url)) {
    return {
      ok: false,
      message:
        "NEXT_PUBLIC_SUPABASE_URL must be a full URL starting with https:// (for example https://xxxx.supabase.co). Check .env.local.",
    };
  }

  return { ok: true, url, anonKey };
}
