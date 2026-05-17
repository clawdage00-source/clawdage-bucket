import { Shield } from "lucide-react";

export function PrivacyTrustBanner() {
  return (
    <div className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-900 px-5 py-5 text-white sm:px-6 sm:py-6">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
        <Shield className="h-5 w-5 text-white" aria-hidden />
      </span>
      <div>
        <p className="text-sm font-semibold tracking-tight">Your privacy is our priority</p>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
          We process your files locally in your browser and never see your document contents.
        </p>
      </div>
    </div>
  );
}
