"use client";

import { Shield } from "lucide-react";
import { useActionState } from "react";

import { FormSubmitButton } from "@/components/form-submit-button";
import {
  verifyAdminAccessCodeFormAction,
  type AdminAuthResult,
} from "@/lib/supabase/admin-auth";

type AdminLoginFormProps = {
  initialError?: string;
};

export function AdminLoginForm({ initialError }: AdminLoginFormProps) {
  const [state, formAction] = useActionState<AdminAuthResult | null, FormData>(
    verifyAdminAccessCodeFormAction,
    null,
  );

  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      <div className="hidden w-1/2 flex-col justify-between border-r border-slate-200 bg-white p-12 lg:flex">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Shield className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-lg font-semibold text-slate-900">Clawdage Admin</span>
        </div>
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
            Operations console
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-500">
            Monitor analytics, traffic, and tool usage from a single secure dashboard.
          </p>
        </div>
        <p className="text-xs text-slate-400">© Clawdage · Authorized access only</p>
      </div>

      <div className="flex w-full flex-1 items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Shield className="h-6 w-6" aria-hidden />
            </span>
            <h1 className="text-2xl font-semibold text-slate-900">Admin sign in</h1>
            <p className="mt-2 text-sm text-slate-500">Enter your access code to continue.</p>
          </div>

          <div className="hidden lg:block">
            <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>
            <p className="mt-2 text-sm text-slate-500">Enter your access code to open the panel.</p>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            {initialError ? (
              <p
                className="mb-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700"
                role="alert"
              >
                {initialError}
              </p>
            ) : null}

            {state?.ok === false ? (
              <p
                className="mb-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700"
                role="alert"
              >
                {state.message}
              </p>
            ) : null}

            <form action={formAction} className="space-y-5">
              <div>
                <label htmlFor="admin-code" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Access code
                </label>
                <input
                  id="admin-code"
                  name="code"
                  type="password"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={12}
                  placeholder="••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center font-mono text-lg tracking-[0.35em] text-slate-900 outline-none transition placeholder:tracking-normal placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <FormSubmitButton
                pendingLabel="Verifying…"
                className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
              >
                Enter admin panel
              </FormSubmitButton>
            </form>

            <p className="mt-6 text-center text-xs text-slate-400">
              Session expires after 2 hours of inactivity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
