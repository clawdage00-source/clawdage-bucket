"use client";

import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ClipboardCopy,
  Download,
  ImagePlus,
  Link2,
  Loader2,
  Palette,
  Smartphone,
  User,
  Wifi,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useId, useMemo, useRef, useState } from "react";

import { trackToolUse } from "@/lib/analytics";
import { DailyPassUpsellModal } from "@/components/tools/daily-pass-upsell-modal";
import {
  buildUpiPayload,
  buildUrlPayload,
  buildVcardPayload,
  buildWifiPayload,
} from "@/lib/qr-payloads";

const DEFAULT_FG = "#000000";
const DEFAULT_BG = "#ffffff";
const PREVIEW_SIZE = 280;
const EXPORT_STD_SIZE = 512;
const EXPORT_HI_SIZE = 2048;

type TabId = "url" | "wifi" | "vcard" | "upi";

const TABS: { id: TabId; label: string; icon: typeof Link2 }[] = [
  { id: "url", label: "URL", icon: Link2 },
  { id: "wifi", label: "WiFi", icon: Wifi },
  { id: "vcard", label: "VCard", icon: User },
  { id: "upi", label: "UPI", icon: Smartphone },
];

/** Parses `#RGB` or `#RRGGBB` (with or without `#`). */
function parseHexColor(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  const body = t.startsWith("#") ? t.slice(1) : t;
  if (!/^[0-9a-fA-F]+$/.test(body)) return null;
  let h = body;
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (h.length !== 6) return null;
  return `#${h.toLowerCase()}`;
}

const PRESET_FG = ["#000000", "#1e293b", "#0f766e", "#1d4ed8", "#7c3aed", "#be123c", "#c2410c", "#f8fafc"];

const PRESET_BG = ["#ffffff", "#f8fafc", "#ecfdf5", "#eff6ff", "#faf5ff", "#fef2f2", "#fffbeb", "#0f172a"];

function logoSettings(size: number, src: string | null) {
  if (!src) return undefined;
  const dim = Math.max(32, Math.floor(size * 0.22));
  return {
    src,
    height: dim,
    width: dim,
    excavate: true as const,
  };
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/png");
  });
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export type QrGeneratorToolProps = {
  isPro: boolean;
};

export function QrGeneratorTool({ isPro }: QrGeneratorToolProps) {
  const formId = useId();
  const previewRef = useRef<HTMLCanvasElement>(null);
  const exportStdRef = useRef<HTMLCanvasElement>(null);
  const exportHiRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [tab, setTab] = useState<TabId>("url");
  const [urlText, setUrlText] = useState("https://");
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPass, setWifiPass] = useState("");
  const [wifiEnc, setWifiEnc] = useState<"WPA" | "WEP">("WPA");
  const [vcName, setVcName] = useState("");
  const [vcPhone, setVcPhone] = useState("");
  const [vcEmail, setVcEmail] = useState("");
  const [vcCompany, setVcCompany] = useState("");
  const [upiId, setUpiId] = useState("");
  const [upiName, setUpiName] = useState("");
  const [upiAmount, setUpiAmount] = useState("");

  const [fgColor, setFgColor] = useState(DEFAULT_FG);
  const [bgColor, setBgColor] = useState(DEFAULT_BG);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [roundedFrame, setRoundedFrame] = useState(false);

  const [upsellOpen, setUpsellOpen] = useState(false);
  const [copyHint, setCopyHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hexDraftFg, setHexDraftFg] = useState<string | null>(null);
  const [hexDraftBg, setHexDraftBg] = useState<string | null>(null);

  const openUpsell = useCallback(() => setUpsellOpen(true), []);

  const payload = useMemo(() => {
    switch (tab) {
      case "url":
        return buildUrlPayload(urlText);
      case "wifi":
        return buildWifiPayload(wifiSsid, wifiPass, wifiEnc);
      case "vcard":
        return buildVcardPayload({
          name: vcName,
          phone: vcPhone,
          email: vcEmail,
          company: vcCompany,
        });
      case "upi":
        return buildUpiPayload(upiId, upiName, upiAmount || undefined);
      default:
        return " ";
    }
  }, [
    tab,
    urlText,
    wifiSsid,
    wifiPass,
    wifiEnc,
    vcName,
    vcPhone,
    vcEmail,
    vcCompany,
    upiId,
    upiName,
    upiAmount,
  ]);

  const effectiveLogo = isPro ? logoDataUrl : null;
  const effectiveFg = isPro ? fgColor : DEFAULT_FG;
  const effectiveBg = isPro ? bgColor : DEFAULT_BG;
  const effectiveRounded = isPro ? roundedFrame : false;

  const qrLevel = effectiveLogo ? ("H" as const) : ("M" as const);

  const baseQrProps = useMemo(
    () => ({
      value: payload,
      fgColor: effectiveFg,
      bgColor: effectiveBg,
      level: qrLevel,
      marginSize: 2,
    }),
    [payload, effectiveFg, effectiveBg, qrLevel],
  );

  const onFgChange = (v: string) => {
    if (!isPro) {
      openUpsell();
      return;
    }
    setFgColor(v);
  };

  const onBgChange = (v: string) => {
    if (!isPro) {
      openUpsell();
      return;
    }
    setBgColor(v);
  };

  const onLogoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!isPro) {
      openUpsell();
      return;
    }
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) {
      setCopyHint("Use PNG, JPG, or WebP for the logo.");
      window.setTimeout(() => setCopyHint(null), 2500);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setLogoDataUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const clearLogo = () => setLogoDataUrl(null);

  const toggleRounded = () => {
    if (!isPro) {
      openUpsell();
      return;
    }
    setRoundedFrame((r) => !r);
  };

  const downloadPng = (canvas: HTMLCanvasElement | null, label: string) => {
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${label}.png`;
    a.click();
    trackToolUse("qr-generator", { label });
  };

  const downloadStandardPng = () => {
    downloadPng(exportStdRef.current, "standard");
  };

  const downloadHiResPng = () => {
    if (!isPro) {
      openUpsell();
      return;
    }
    downloadPng(exportHiRef.current, "hires");
  };

  const downloadSvg = () => {
    if (!isPro) {
      openUpsell();
      return;
    }
    const el = svgRef.current;
    if (!el) return;
    const clone = el.cloneNode(true) as SVGSVGElement;
    if (!clone.getAttribute("xmlns")) clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const blob = new Blob([clone.outerHTML], { type: "image/svg+xml;charset=utf-8" });
    triggerBlobDownload(blob, "qr-vector.svg");
  };

  const copyImage = async () => {
    setBusy(true);
    setCopyHint(null);
    try {
      const canvas = exportStdRef.current ?? previewRef.current;
      if (!canvas) return;
      const blob = await canvasToBlob(canvas);
      if (!blob || !navigator.clipboard?.write) {
        setCopyHint("Clipboard not supported in this browser.");
        return;
      }
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopyHint("Copied to clipboard.");
    } catch {
      setCopyHint("Could not copy — try downloading instead.");
    } finally {
      setBusy(false);
      window.setTimeout(() => setCopyHint(null), 2500);
    }
  };

  const frameClass = effectiveRounded ? "rounded-[28px] p-3 shadow-inner" : "rounded-lg p-2";

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="border-b border-border bg-muted/50 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <Link
            href="/#tools"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All tools
          </Link>
          <p className="text-xs text-muted-foreground">
            {isPro ? "Pro: custom colors, logo, SVG & hi-res PNG" : "Free: standard PNG · upgrade for Pro exports"}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const }}
        >
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">QR code generator</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Create scannable codes for links, WiFi, contacts, and UPI. Everything renders locally in your
            browser.
          </p>
        </motion.div>

        <div className="mt-8 flex flex-col gap-8 lg:grid lg:grid-cols-2 lg:items-start lg:gap-10">
          {/* Preview first on mobile */}
          <div className="order-1 flex flex-col items-center lg:order-2 lg:sticky lg:top-24">
            <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:text-left">
              Live preview
            </p>
            <motion.div
              key={payload + effectiveFg + effectiveBg + (effectiveLogo ?? "") + String(effectiveRounded)}
              initial={{ opacity: 0.85, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className={`inline-block border border-border bg-card ${frameClass}`}
              style={{ backgroundColor: effectiveBg }}
            >
              <QRCodeCanvas
                {...baseQrProps}
                size={PREVIEW_SIZE}
                ref={previewRef}
                title="QR preview"
                imageSettings={logoSettings(PREVIEW_SIZE, effectiveLogo)}
              />
            </motion.div>
            <p className="mt-3 max-w-xs text-center text-[11px] leading-relaxed text-muted-foreground lg:text-left">
              Scan with your phone camera to test. UPI uses the standard <code className="text-muted-foreground">upi://pay</code>{" "}
              format.
            </p>

            <div className="mt-6 flex w-full max-w-sm flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => void copyImage()}
                disabled={busy}
                className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCopy className="h-4 w-4" />}
                Copy image
              </button>
              <button
                type="button"
                onClick={downloadStandardPng}
                className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <Download className="h-4 w-4" />
                PNG (standard)
              </button>
            </div>
            {isPro ? (
              <div className="mt-2 flex w-full max-w-sm flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={downloadHiResPng}
                  className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted"
                >
                  <Download className="h-4 w-4" />
                  Hi-res PNG
                </button>
                <button
                  type="button"
                  onClick={downloadSvg}
                  className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted"
                >
                  <Download className="h-4 w-4" />
                  SVG
                </button>
              </div>
            ) : null}
            <AnimatePresence>
              {copyHint ? (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 text-center text-xs font-medium text-muted-foreground"
                >
                  {copyHint}
                </motion.p>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="order-2 space-y-6 lg:order-1">
            <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-muted/80 p-1">
              {TABS.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition sm:flex-none sm:px-4 ${
                      active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    {t.label}
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              {tab === "url" ? (
                <div>
                  <label htmlFor={`${formId}-url`} className="text-sm font-medium text-foreground">
                    URL
                  </label>
                  <input
                    id={`${formId}-url`}
                    value={urlText}
                    onChange={(e) => setUrlText(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-border bg-muted/50 px-3 py-3 text-sm text-foreground outline-none focus:border-border focus:ring-2"
                    placeholder="https://example.com"
                    autoComplete="url"
                  />
                </div>
              ) : null}

              {tab === "wifi" ? (
                <div className="space-y-4">
                  <div>
                    <label htmlFor={`${formId}-ssid`} className="text-sm font-medium text-foreground">
                      Network name (SSID)
                    </label>
                    <input
                      id={`${formId}-ssid`}
                      value={wifiSsid}
                      onChange={(e) => setWifiSsid(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-border bg-muted/50 px-3 py-3 text-sm text-foreground outline-none focus:border-border focus:ring-2"
                    />
                  </div>
                  <div>
                    <label htmlFor={`${formId}-wpass`} className="text-sm font-medium text-foreground">
                      Password
                    </label>
                    <input
                      id={`${formId}-wpass`}
                      type="password"
                      value={wifiPass}
                      onChange={(e) => setWifiPass(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-border bg-muted/50 px-3 py-3 text-sm text-foreground outline-none focus:border-border focus:ring-2"
                    />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground">Encryption</span>
                    <div className="mt-2 flex gap-2">
                      {(["WPA", "WEP"] as const).map((enc) => (
                        <button
                          key={enc}
                          type="button"
                          onClick={() => setWifiEnc(enc)}
                          className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
                            wifiEnc === enc
                              ? "border-black bg-black text-white"
                              : "border-border bg-card text-muted-foreground hover:border-border"
                          }`}
                        >
                          {enc}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {tab === "vcard" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor={`${formId}-fn`} className="text-sm font-medium text-foreground">
                      Full name
                    </label>
                    <input
                      id={`${formId}-fn`}
                      value={vcName}
                      onChange={(e) => setVcName(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-border bg-muted/50 px-3 py-3 text-sm text-foreground outline-none focus:border-border focus:ring-2"
                    />
                  </div>
                  <div>
                    <label htmlFor={`${formId}-tel`} className="text-sm font-medium text-foreground">
                      Phone
                    </label>
                    <input
                      id={`${formId}-tel`}
                      value={vcPhone}
                      onChange={(e) => setVcPhone(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-border bg-muted/50 px-3 py-3 text-sm text-foreground outline-none focus:border-border focus:ring-2"
                    />
                  </div>
                  <div>
                    <label htmlFor={`${formId}-em`} className="text-sm font-medium text-foreground">
                      Email
                    </label>
                    <input
                      id={`${formId}-em`}
                      type="email"
                      value={vcEmail}
                      onChange={(e) => setVcEmail(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-border bg-muted/50 px-3 py-3 text-sm text-foreground outline-none focus:border-border focus:ring-2"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor={`${formId}-org`} className="text-sm font-medium text-foreground">
                      Company
                    </label>
                    <input
                      id={`${formId}-org`}
                      value={vcCompany}
                      onChange={(e) => setVcCompany(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-border bg-muted/50 px-3 py-3 text-sm text-foreground outline-none focus:border-border focus:ring-2"
                    />
                  </div>
                </div>
              ) : null}

              {tab === "upi" ? (
                <div className="space-y-4">
                  <div>
                    <label htmlFor={`${formId}-pa`} className="text-sm font-medium text-foreground">
                      UPI ID (VPA)
                    </label>
                    <input
                      id={`${formId}-pa`}
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-border bg-muted/50 px-3 py-3 text-sm text-foreground outline-none focus:border-border focus:ring-2"
                      placeholder="name@bank"
                    />
                  </div>
                  <div>
                    <label htmlFor={`${formId}-pn`} className="text-sm font-medium text-foreground">
                      Payee name
                    </label>
                    <input
                      id={`${formId}-pn`}
                      value={upiName}
                      onChange={(e) => setUpiName(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-border bg-muted/50 px-3 py-3 text-sm text-foreground outline-none focus:border-border focus:ring-2"
                    />
                  </div>
                  <div>
                    <label htmlFor={`${formId}-am`} className="text-sm font-medium text-foreground">
                      Amount (₹, optional)
                    </label>
                    <input
                      id={`${formId}-am`}
                      value={upiAmount}
                      onChange={(e) => setUpiAmount(e.target.value)}
                      inputMode="decimal"
                      className="mt-2 w-full rounded-xl border border-border bg-muted/50 px-3 py-3 text-sm text-foreground outline-none focus:border-border focus:ring-2"
                      placeholder="199.00"
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" aria-hidden />
                <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                  Customization {isPro ? "" : "(Pro)"}
                </h2>
              </div>
              {!isPro ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Colors, logo, rounded frame, SVG, and hi-res PNG unlock with a Daily Pass (from ₹19).
                </p>
              ) : null}
              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                <div>
                  <span id={`${formId}-fg-label`} className="text-sm font-medium text-foreground">
                    Foreground
                  </span>
                  <p className="mt-0.5 text-xs text-muted-foreground">Browser color picker + hex, or quick swatches.</p>
                  <div className="mt-3 flex gap-3">
                    <input
                      id={`${formId}-fg`}
                      type="color"
                      aria-labelledby={`${formId}-fg-label`}
                      value={effectiveFg}
                      onChange={(e) => {
                        setHexDraftFg(null);
                        onFgChange(e.target.value);
                      }}
                      className={`h-12 w-[4.5rem] shrink-0 cursor-pointer rounded-xl border border-border bg-card p-1 shadow-sm ${!isPro ? "opacity-70" : ""}`}
                    />
                    <input
                      type="text"
                      inputMode="text"
                      autoCapitalize="off"
                      autoCorrect="off"
                      spellCheck={false}
                      aria-label="Foreground hex color"
                      value={(isPro ? (hexDraftFg ?? fgColor) : DEFAULT_FG).toUpperCase()}
                      onChange={(e) => {
                        if (!isPro) {
                          openUpsell();
                          return;
                        }
                        setHexDraftFg(e.target.value);
                      }}
                      onBlur={() => {
                        if (!isPro) return;
                        const raw = hexDraftFg;
                        setHexDraftFg(null);
                        if (raw == null) return;
                        const parsed = parseHexColor(raw);
                        if (parsed) setFgColor(parsed);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                      }}
                      placeholder="#000000"
                      className={`min-w-0 flex-1 rounded-xl border border-border bg-muted/80 px-3 py-2.5 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-border focus:ring-2 focus:ring-slate-200 ${!isPro ? "cursor-pointer opacity-70" : ""}`}
                      readOnly={!isPro}
                      onClick={() => {
                        if (!isPro) openUpsell();
                      }}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Foreground presets">
                    {PRESET_FG.map((c) => (
                      <button
                        key={`fg-${c}`}
                        type="button"
                        title={c}
                        onClick={() => {
                          if (!isPro) {
                            openUpsell();
                            return;
                          }
                          setHexDraftFg(null);
                          onFgChange(c);
                        }}
                        className={`h-8 w-8 rounded-full border border-border shadow-sm transition hover:scale-105 hover:ring-2 hover:ring-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black ${!isPro ? "opacity-70" : ""}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <span id={`${formId}-bg-label`} className="text-sm font-medium text-foreground">
                    Background
                  </span>
                  <p className="mt-0.5 text-xs text-muted-foreground">Pick a high contrast against the modules.</p>
                  <div className="mt-3 flex gap-3">
                    <input
                      id={`${formId}-bg`}
                      type="color"
                      aria-labelledby={`${formId}-bg-label`}
                      value={effectiveBg}
                      onChange={(e) => {
                        setHexDraftBg(null);
                        onBgChange(e.target.value);
                      }}
                      className={`h-12 w-[4.5rem] shrink-0 cursor-pointer rounded-xl border border-border bg-card p-1 shadow-sm ${!isPro ? "opacity-70" : ""}`}
                    />
                    <input
                      type="text"
                      inputMode="text"
                      autoCapitalize="off"
                      autoCorrect="off"
                      spellCheck={false}
                      aria-label="Background hex color"
                      value={(isPro ? (hexDraftBg ?? bgColor) : DEFAULT_BG).toUpperCase()}
                      onChange={(e) => {
                        if (!isPro) {
                          openUpsell();
                          return;
                        }
                        setHexDraftBg(e.target.value);
                      }}
                      onBlur={() => {
                        if (!isPro) return;
                        const raw = hexDraftBg;
                        setHexDraftBg(null);
                        if (raw == null) return;
                        const parsed = parseHexColor(raw);
                        if (parsed) setBgColor(parsed);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                      }}
                      placeholder="#FFFFFF"
                      className={`min-w-0 flex-1 rounded-xl border border-border bg-muted/80 px-3 py-2.5 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-border focus:ring-2 focus:ring-slate-200 ${!isPro ? "cursor-pointer opacity-70" : ""}`}
                      readOnly={!isPro}
                      onClick={() => {
                        if (!isPro) openUpsell();
                      }}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Background presets">
                    {PRESET_BG.map((c) => (
                      <button
                        key={`bg-${c}`}
                        type="button"
                        title={c}
                        onClick={() => {
                          if (!isPro) {
                            openUpsell();
                            return;
                          }
                          setHexDraftBg(null);
                          onBgChange(c);
                        }}
                        className={`h-8 w-8 rounded-full border border-border shadow-sm transition hover:scale-105 hover:ring-2 hover:ring-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black ${!isPro ? "opacity-70" : ""}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <span className="text-sm font-medium text-foreground">Center logo</span>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" id={`${formId}-logo`} onChange={onLogoPick} />
                  <label
                    htmlFor={`${formId}-logo`}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-muted px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
                  >
                    <ImagePlus className="h-4 w-4" aria-hidden />
                    Add logo
                  </label>
                  {logoDataUrl && isPro ? (
                    <button type="button" onClick={clearLogo} className="text-sm font-medium text-muted-foreground underline">
                      Remove logo
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Rounded frame</p>
                  <p className="text-xs text-muted-foreground">Softer outer corners on the preview.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={roundedFrame}
                  onClick={toggleRounded}
                  className={`relative h-8 w-14 shrink-0 rounded-full transition ${
                    roundedFrame ? "bg-black" : "bg-muted"
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-card shadow transition ${
                      roundedFrame ? "translate-x-6" : ""
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Off-screen export canvases + SVG (must stay mounted for refs) */}
        <div className="pointer-events-none fixed left-[-2400px] top-0 opacity-0" aria-hidden>
          <QRCodeCanvas
            {...baseQrProps}
            size={EXPORT_STD_SIZE}
            ref={exportStdRef}
            imageSettings={logoSettings(EXPORT_STD_SIZE, effectiveLogo)}
          />
          {isPro ? (
            <QRCodeCanvas
              {...baseQrProps}
              size={EXPORT_HI_SIZE}
              ref={exportHiRef}
              imageSettings={logoSettings(EXPORT_HI_SIZE, effectiveLogo)}
            />
          ) : null}
          <QRCodeSVG
            {...baseQrProps}
            size={512}
            ref={svgRef}
            imageSettings={logoSettings(512, effectiveLogo)}
          />
        </div>
      </div>

      <DailyPassUpsellModal
        open={upsellOpen}
        onClose={() => setUpsellOpen(false)}
        title="Unlock Pro QR features"
        description={
          <>
            Custom colors, logo in the center, rounded frame, <span className="font-medium text-foreground">SVG</span>, and{" "}
            <span className="font-medium text-foreground">high-resolution PNG</span> exports are included with a{" "}
            <span className="font-medium text-foreground">Daily Pass from ₹19</span>.
          </>
        }
        secondaryActionLabel="Continue with free"
      />
    </div>
  );
}
