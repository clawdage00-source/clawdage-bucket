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
import {
  hasSupabaseAuthCookie,
  isAuthNetworkError,
  isProtectedPath,
  middlewareAuthFetch,
  shouldLogAuthMiddlewareError,
  shouldRefreshSupabaseSession,
} from "@/lib/supabase/middleware-auth";

/** Caps Edge wait when Supabase is slow or unreachable (avoids long middleware stalls). */
const AUTH_GET_USER_TIMEOUT_MS = 2800;

const ADMIN_PUBLIC_PATHS = ["/admin/login"];

function skipSupabaseInMiddleware(): boolean {
  return process.env.NODE_ENV === "development" && process.env.SKIP_SUPABASE_MIDDLEWARE === "1";
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isAdminPath(pathname)) {
    return handleAdminRoute(request, pathname);
  }

  if (!shouldRefreshSupabaseSession(pathname, request)) {
    return NextResponse.next({ request });
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
  const hadAuthCookie = hasSupabaseAuthCookie(request);

  const supabase = createServerClient(env.url, env.anonKey, {
    global: {
      fetch: middlewareAuthFetch,
    },
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
  let authUnavailable = false;

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
    authUnavailable = isAuthNetworkError(err);
    if (process.env.NODE_ENV === "development") {
      if (authUnavailable) {
        console.warn(
          `[middleware] Supabase unreachable (${pathname}) — skipped auth refresh. Check network or NEXT_PUBLIC_SUPABASE_URL.`,
        );
      } else if (shouldLogAuthMiddlewareError(pathname, err)) {
        console.warn("[middleware] Supabase auth.getUser() failed. Continuing without a user.", err);
      }
    }
  }

  if (isProtectedPath(pathname) && !user) {
    if (authUnavailable && hadAuthCookie) {
      return supabaseResponse;
    }
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html|txt|ico)$).*)",
  ],
};
