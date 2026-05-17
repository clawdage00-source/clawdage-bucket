import type { EmailOtpType } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { trackServerAnalyticsEvent } from "@/lib/analytics-server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
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

  const isAdminFlow = next.startsWith("/admin");

  if (!env.ok) {
    const loginPath = isAdminFlow ? "/admin/login" : "/login";
    return NextResponse.redirect(
      new URL(`${loginPath}?error=${encodeURIComponent(env.message)}`, origin),
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
    const loginPath = isAdminFlow ? "/admin/login" : "/login";
    return NextResponse.redirect(
      new URL(`${loginPath}?error=${encodeURIComponent(msg)}`, origin),
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

  async function afterAuthSuccess() {
    if (isAdminFlow) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const admin = createServiceRoleClient();
    let isSignup = false;
    if (admin) {
      const { data: profile } = await admin
        .from("profiles")
        .select("created_at")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.created_at) {
        const created = new Date(profile.created_at).getTime();
        isSignup = Date.now() - created < 120_000;
      }
    }

    const sessionId = `auth_${user.id}`;
    await trackServerAnalyticsEvent({
      eventName: isSignup ? "auth_signup" : "auth_login",
      userId: user.id,
      sessionId,
      path: next,
      userAgent: request.headers.get("user-agent"),
      metadata: { provider: type ?? "oauth" },
    });
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const loginPath = isAdminFlow ? "/admin/login" : "/login";
      return NextResponse.redirect(
        new URL(`${loginPath}?error=${encodeURIComponent(error.message)}`, origin),
      );
    }
    await afterAuthSuccess();
    return successRedirect;
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (error) {
      const loginPath = isAdminFlow ? "/admin/login" : "/login";
      return NextResponse.redirect(
        new URL(`${loginPath}?error=${encodeURIComponent(error.message)}`, origin),
      );
    }
    await afterAuthSuccess();
    return successRedirect;
  }

  const loginPath = isAdminFlow ? "/admin/login" : "/login";
  return NextResponse.redirect(new URL(`${loginPath}?error=missing_code`, origin));
}
