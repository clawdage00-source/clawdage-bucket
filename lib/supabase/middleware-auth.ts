import type { NextRequest } from "next/server";

/** Prefixes that require an authenticated user (extend as you add routes). */
export const PROTECTED_PREFIXES = ["/dashboard", "/account", "/subscription", "/profile"];

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** True when the browser likely has a Supabase Auth session cookie. */
export function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some(({ name }) => name.startsWith("sb-"));
}

/**
 * Only hit Supabase Auth on protected routes or when session cookies exist
 * (cookie refresh). Skips auth on anonymous tool/page traffic.
 */
export function shouldRefreshSupabaseSession(
  pathname: string,
  request: NextRequest,
): boolean {
  if (isProtectedPath(pathname)) return true;
  return hasSupabaseAuthCookie(request);
}

export function isAuthNetworkError(err: unknown): boolean {
  if (err instanceof Error) {
    if (err.message === "auth_get_user_timeout") return true;
    if (err.message === "auth_fetch_aborted") return true;
    if (err.message.toLowerCase().includes("fetch failed")) return true;
    const cause = (err as Error & { cause?: unknown }).cause;
    if (cause instanceof Error) {
      const code = (cause as Error & { code?: string }).code;
      if (code === "UND_ERR_CONNECT_TIMEOUT" || code === "ETIMEDOUT") return true;
    }
  }
  return false;
}

export function isBenignMissingSessionError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const authErr = err as { __isAuthError?: boolean; name?: string; message?: string };
  if (authErr.__isAuthError !== true) return false;
  return (
    authErr.name === "AuthSessionMissingError" ||
    String(authErr.message ?? "").toLowerCase().includes("auth session missing")
  );
}

export function shouldLogAuthMiddlewareError(pathname: string, err: unknown): boolean {
  if (isAuthNetworkError(err)) return false;
  if (isBenignMissingSessionError(err)) {
    return isProtectedPath(pathname);
  }
  return true;
}

export function middlewareAuthFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const timeoutMs = 2500;
  return fetch(input, {
    ...init,
    signal: init?.signal ?? AbortSignal.timeout(timeoutMs),
  }).catch((err) => {
    if (err instanceof Error && err.name === "TimeoutError") {
      throw new Error("auth_fetch_aborted");
    }
    throw err;
  });
}
