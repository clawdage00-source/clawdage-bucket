"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SEC,
  adminSessionCookieOptions,
  buildAdminSessionPayload,
  decodeAdminSessionCookie,
  encodeAdminSessionCookie,
} from "@/lib/admin/admin-session-cookie";

export type AdminAuthResult = { ok: true; message?: string } | { ok: false; message: string };

const DEFAULT_ACCESS_CODE = "006706";

function getAdminAccessCode(): string {
  return process.env.ADMIN_ACCESS_CODE?.trim() || DEFAULT_ACCESS_CODE;
}

function verifyAccessCode(input: string, expected: string): boolean {
  const a = input.trim();
  if (a.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

async function setAdminVerifiedCookie() {
  const payload = buildAdminSessionPayload();
  const token = await encodeAdminSessionCookie(payload);
  if (!token) {
    throw new Error(
      "Admin session signing is not configured. Set ADMIN_SESSION_SECRET or SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    );
  }
  const cookieStore = await cookies();
  cookieStore.set(
    ADMIN_SESSION_COOKIE,
    token,
    adminSessionCookieOptions(ADMIN_SESSION_MAX_AGE_SEC),
  );
}

async function clearAdminCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function getAdminSessionFromCookies() {
  const cookieStore = await cookies();
  return decodeAdminSessionCookie(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function verifyAdminAccessCode(code: string): Promise<AdminAuthResult> {
  const expected = getAdminAccessCode();
  const normalized = code.replace(/\D/g, "").trim();

  if (!normalized) {
    return { ok: false, message: "Enter the access code." };
  }

  if (!verifyAccessCode(normalized, expected)) {
    return { ok: false, message: "Invalid access code." };
  }

  await setAdminVerifiedCookie();
  return { ok: true };
}

export async function verifyAdminAccessCodeFormAction(
  _prev: AdminAuthResult | null,
  formData: FormData,
): Promise<AdminAuthResult> {
  const code = String(formData.get("code") ?? "");
  const result = await verifyAdminAccessCode(code);
  if (result.ok) {
    redirect("/admin/dashboard");
  }
  return result;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  return Boolean(await getAdminSessionFromCookies());
}

/** Read-only guard for Server Components. Session refresh runs in middleware. */
export async function requireAdminAccess(): Promise<void> {
  const session = await getAdminSessionFromCookies();
  if (!session) {
    redirect("/admin/login");
  }
}

export async function adminSignOut(): Promise<void> {
  await clearAdminCookies();
  redirect("/admin/login");
}
