import type { EmailOtpType } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * OAuth (PKCE) + email magic link completion. Session cookies are written on the redirect response.
 * New users get a `profiles` row from the DB trigger in `migration/supabase_migration.sql`.
 */
export async function GET(request: NextRequest) {
  const env = getSupabaseEnv();
  const url = request.nextUrl.clone();
  const { origin } = url;

  let next = url.searchParams.get("next") ?? "/";
  if (!next.startsWith("/") || next.startsWith("//")) {
    next = "/";
  }

  if (!env.ok) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(env.message)}`, origin),
    );
  }

  const oauthError = url.searchParams.get("error");
  const oauthErrorDescription = url.searchParams.get("error_description");
  if (oauthError) {
    let msg = oauthError;
    if (oauthErrorDescription) {
      try {
        msg = `${oauthError}: ${decodeURIComponent(oauthErrorDescription.replace(/\+/g, " "))}`;
      } catch {
        msg = `${oauthError}: ${oauthErrorDescription}`;
      }
    }
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(msg)}`, origin),
    );
  }

  const code = url.searchParams.get("code");
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  const successRedirect = NextResponse.redirect(new URL(next, origin));

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          successRedirect.cookies.set(name, value, options),
        );
      },
    },
  });

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, origin),
      );
    }
    return successRedirect;
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, origin),
      );
    }
    return successRedirect;
  }

  return NextResponse.redirect(new URL("/login?error=missing_code", origin));
}
