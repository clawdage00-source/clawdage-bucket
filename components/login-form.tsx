"use client";

import { useActionState, useState } from "react";

import { sendMagicLinkFormAction, signInWithGoogle } from "@/lib/supabase/auth-actions";
import type { MagicLinkResult } from "@/lib/supabase/auth-actions";

import { FormSubmitButton } from "./form-submit-button";

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

type LoginFormProps = {
  initialUrlError?: string;
};

export function LoginForm({ initialUrlError }: LoginFormProps) {
  const [magicState, magicFormAction] = useActionState<
    MagicLinkResult | null,
    FormData
  >(sendMagicLinkFormAction, null);
  const [email, setEmail] = useState("");

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-6 py-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-black">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-600">Login to access pro tools</p>
        </div>

        {initialUrlError ? (
          <p
            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-800"
            role="alert"
          >
            {initialUrlError}
          </p>
        ) : null}

        {magicState?.ok === false ? (
          <p
            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-800"
            role="alert"
          >
            {magicState.message}
          </p>
        ) : null}

        {magicState?.ok === true ? (
          <p
            className="mb-6 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm text-slate-800"
            role="status"
          >
            Check your email — we sent you a magic link.
          </p>
        ) : null}

        <form action={signInWithGoogle} className="mb-6">
          <FormSubmitButton
            pendingLabel="Redirecting…"
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-slate-50 disabled:opacity-60"
          >
            <GoogleMark className="h-5 w-5" />
            Continue with Google
          </FormSubmitButton>
        </form>

        <div className="mb-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">or</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <form action={magicFormAction} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-black">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-black outline-none ring-black/10 transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2"
            />
          </div>
          <FormSubmitButton
            pendingLabel="Sending…"
            className="w-full rounded-xl bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60"
          >
            Send Magic Link
          </FormSubmitButton>
        </form>
      </div>
    </div>
  );
}
