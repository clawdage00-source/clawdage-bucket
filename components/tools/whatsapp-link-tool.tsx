"use client";

import { QRCodeCanvas } from "qrcode.react";
import { ClipboardCopy, Link2 } from "lucide-react";
import { useMemo, useState } from "react";

import { ToolChrome } from "@/components/tools/shared-tool-chrome";
import { trackToolUse } from "@/lib/analytics";
import { buildWhatsAppUrl, WHATSAPP_COUNTRIES } from "@/lib/whatsapp-link";

export function WhatsAppLinkTool() {
  const [country, setCountry] = useState("IN");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const dial = WHATSAPP_COUNTRIES.find((c) => c.code === country)?.dial ?? "91";
  const url = useMemo(() => buildWhatsAppUrl(dial, phone, message), [dial, phone, message]);

  const copyLink = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    trackToolUse("whatsapp-link");
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolChrome
      title="WhatsApp Click-to-Chat Link Generator"
      description="Create wa.me links with country code, pre-filled messages, and QR codes — perfect for business cards, Instagram bios, and shop counters."
    >
      <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
          <div>
            <label className="text-sm font-medium text-slate-800">Country</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
            >
              {WHATSAPP_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label} (+{c.dial})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-800">WhatsApp number</label>
            <div className="mt-1 flex gap-2">
              <span className="inline-flex items-center rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm text-slate-600">
                +{dial}
              </span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                inputMode="tel"
                className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-800">Pre-filled message (optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Hi, I saw your product on Instagram…"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
            />
          </div>
          {url ? (
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="break-all text-xs text-slate-700">{url}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void copyLink()}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  <ClipboardCopy className="h-3.5 w-3.5" />
                  {copied ? "Copied!" : "Copy link"}
                </button>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                >
                  <Link2 className="h-3.5 w-3.5" /> Open in WhatsApp
                </a>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6">
          {url ? (
            <>
              <QRCodeCanvas value={url} size={220} />
              <p className="mt-4 text-center text-sm text-slate-600">Scan to start a WhatsApp chat</p>
            </>
          ) : (
            <p className="text-sm text-slate-500">Enter a phone number to generate link &amp; QR</p>
          )}
        </aside>
      </div>
    </ToolChrome>
  );
}
