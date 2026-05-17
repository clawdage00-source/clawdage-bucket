"use client";

import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = sessionStorage.getItem("clawdage-pwa-dismissed");
    if (stored === "1") return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setDismissed(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  if (dismissed || !deferred) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-md rounded-2xl border border-border bg-card p-4 shadow-lg md:bottom-6 md:left-auto md:right-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#251EFF]/10 text-[#251EFF]">
          <Download className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Install Clawdage</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Add to your home screen for faster access to exam &amp; PDF tools.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className="rounded-lg bg-[#251EFF] px-3 py-2 text-xs font-semibold text-white"
              onClick={async () => {
                await deferred.prompt();
                setDismissed(true);
                sessionStorage.setItem("clawdage-pwa-dismissed", "1");
              }}
            >
              Install
            </button>
            <button
              type="button"
              className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground"
              onClick={() => {
                setDismissed(true);
                sessionStorage.setItem("clawdage-pwa-dismissed", "1");
              }}
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-muted"
          aria-label="Dismiss"
          onClick={() => {
            setDismissed(true);
            sessionStorage.setItem("clawdage-pwa-dismissed", "1");
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
