import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseEnv } from "@/lib/supabase/env";

/** Caps Edge wait when Supabase is slow or unreachable (avoids 10s+ `proxy` / middleware stalls). */
const AUTH_GET_USER_TIMEOUT_MS = 2800;

/** Prefixes that require an authenticated user (extend as you add routes). */
const PROTECTED_PREFIXES = ["/dashboard", "/account", "/subscription"];

function skipSupabaseInMiddleware(): boolean {
  return process.env.NODE_ENV === "development" && process.env.SKIP_SUPABASE_MIDDLEWARE === "1";
}

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function middleware(request: NextRequest) {
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
    if (isProtectedPath(request.nextUrl.pathname)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname);
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
    if (process.env.NODE_ENV === "development") {
      const reason = err instanceof Error && err.message === "auth_get_user_timeout" ? "timed out" : "failed";
      console.warn(`[middleware] Supabase auth.getUser() ${reason}. Continuing without a user.`, err);
    }
  }

  if (isProtectedPath(request.nextUrl.pathname) && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
