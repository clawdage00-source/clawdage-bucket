import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SEC,
  adminSessionCookieOptions,
  decodeAdminSessionCookie,
  encodeAdminSessionCookie,
  refreshAdminSessionActivity,
} from "@/lib/admin/admin-session-cookie";
import { getSupabaseEnv } from "@/lib/supabase/env";

/** Caps Edge wait when Supabase is slow or unreachable (avoids 10s+ `proxy` / middleware stalls). */
const AUTH_GET_USER_TIMEOUT_MS = 2800;

/** Prefixes that require an authenticated user (extend as you add routes). */
const PROTECTED_PREFIXES = ["/dashboard", "/account", "/subscription", "/profile"];

const ADMIN_PUBLIC_PATHS = ["/admin/login"];

function skipSupabaseInMiddleware(): boolean {
  return process.env.NODE_ENV === "development" && process.env.SKIP_SUPABASE_MIDDLEWARE === "1";
}

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isAdminPublicPath(pathname: string) {
  return ADMIN_PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function withAdminRouteHeader(response: NextResponse) {
  response.headers.set("x-admin-route", "1");
  return response;
}

async function handleAdminRoute(request: NextRequest, pathname: string) {
  const adminSession = await decodeAdminSessionCookie(
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value,
  );
  const adminGateValid = Boolean(adminSession);

  if (pathname === "/admin") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = adminGateValid ? "/admin/dashboard" : "/admin/login";
    return withAdminRouteHeader(NextResponse.redirect(redirectUrl));
  }

  if (isAdminPublicPath(pathname)) {
    if (adminGateValid) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/admin/dashboard";
      return withAdminRouteHeader(NextResponse.redirect(redirectUrl));
    }
    return withAdminRouteHeader(NextResponse.next({ request }));
  }

  if (!adminGateValid) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin/login";
    redirectUrl.searchParams.set("redirectedFrom", pathname);
    return withAdminRouteHeader(NextResponse.redirect(redirectUrl));
  }

  let response = NextResponse.next({ request });
  if (adminSession) {
    const refreshed = refreshAdminSessionActivity(adminSession);
    const token = await encodeAdminSessionCookie(refreshed);
    if (token) {
      response.cookies.set(
        ADMIN_SESSION_COOKIE,
        token,
        adminSessionCookieOptions(ADMIN_SESSION_MAX_AGE_SEC),
      );
    }
  }

  return withAdminRouteHeader(response);
}

/** No session cookie yet — normal on /login, etc. */
function isBenignMissingSessionError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const authErr = err as { __isAuthError?: boolean; name?: string; message?: string };
  if (authErr.__isAuthError !== true) return false;
  return (
    authErr.name === "AuthSessionMissingError" ||
    String(authErr.message ?? "").toLowerCase().includes("auth session missing")
  );
}

function shouldLogAuthMiddlewareError(pathname: string, err: unknown): boolean {
  if (isBenignMissingSessionError(err)) {
    return isProtectedPath(pathname);
  }
  return true;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isAdminPath(pathname)) {
    return handleAdminRoute(request, pathname);
  }

  const env = getSupabaseEnv();
  if (!env.ok) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[middleware] ${env.message} Skipping Supabase session refresh.`);
    }
    return NextResponse.next({ request });
  }

  if (skipSupabaseInMiddleware()) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[middleware] SKIP_SUPABASE_MIDDLEWARE=1 — not calling Supabase on the Edge. Protected routes see no session.",
      );
    }
    if (isProtectedPath(pathname)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("redirectedFrom", pathname);
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  let user = null;
  try {
    const { data, error } = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("auth_get_user_timeout")), AUTH_GET_USER_TIMEOUT_MS);
      }),
    ]);
    if (error) throw error;
    user = data.user ?? null;
  } catch (err) {
    if (process.env.NODE_ENV === "development" && shouldLogAuthMiddlewareError(pathname, err)) {
      const reason =
        err instanceof Error && err.message === "auth_get_user_timeout" ? "timed out" : "failed";
      console.warn(`[middleware] Supabase auth.getUser() ${reason}. Continuing without a user.`, err);
    }
  }

  if (isProtectedPath(pathname) && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html)$).*)",
  ],
};
