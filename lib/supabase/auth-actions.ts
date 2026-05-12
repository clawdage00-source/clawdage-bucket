"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { getSupabaseEnv } from "./env";
import { getSiteOrigin } from "./site-url";

export type MagicLinkResult = { ok: true } | { ok: false; message: string };

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Starts Google OAuth; user is sent to Google then back to `/auth/callback`.
 */
export async function signInWithGoogle(): Promise<void> {
  const env = getSupabaseEnv();
  if (!env.ok) {
    redirect(`/login?error=${encodeURIComponent(env.message)}`);
  }

  const supabase = await createClient();
  const origin = await getSiteOrigin();
  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("next", "/dashboard");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callback.toString(),
    },
  });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  if (data.url) {
    redirect(data.url);
  }
  redirect("/login?error=oauth_no_url");
}

/**
 * Sends a passwordless magic link to the given email (PKCE; redirect hits `/auth/callback`).
 */
export async function signInWithMagicLink(email: string): Promise<MagicLinkResult> {
  const env = getSupabaseEnv();
  if (!env.ok) {
    return { ok: false, message: env.message };
  }

  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !isValidEmail(trimmed)) {
    return { ok: false, message: "Please enter a valid email address." };
  }

  const supabase = await createClient();
  const origin = await getSiteOrigin();
  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("next", "/dashboard");

  const { error } = await supabase.auth.signInWithOtp({
    email: trimmed,
    options: {
      emailRedirectTo: callback.toString(),
    },
  });

  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
}

/** Form action for `useActionState` (magic link). */
export async function sendMagicLinkFormAction(
  _prevState: MagicLinkResult | null,
  formData: FormData,
): Promise<MagicLinkResult> {
  const email = String(formData.get("email") ?? "");
  return signInWithMagicLink(email);
}

/** Clears the Supabase session and returns to the home page. */
export async function signOut(): Promise<void> {
  const env = getSupabaseEnv();
  if (!env.ok) {
    redirect("/");
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
