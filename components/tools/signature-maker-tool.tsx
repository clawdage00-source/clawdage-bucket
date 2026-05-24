"use client";

import Link from "next/link";
import { Download, Eraser, PenLine, Type } from "lucide-react";
import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";

import { ToolChrome } from "@/components/tools/shared-tool-chrome";
import { trackToolUse } from "@/lib/analytics";
import { downloadBlob } from "@/lib/download-blob";
import {
  renderTypedSignature,
  transparentPngFromDataUrl,
  type SignatureStyle,
} from "@/lib/signature-export";

const STYLES: { id: SignatureStyle; label: string }[] = [
  { id: "cursive", label: "Cursive" },
  { id: "formal", label: "Formal" },
  { id: "bold", label: "Bold" },
  { id: "handwritten", label: "Handwritten" },
];

export function SignatureMakerTool() {
  const padRef = useRef<SignatureCanvas>(null);
  const [mode, setMode] = useState<"draw" | "type">("draw");
  const [typedName, setTypedName] = useState("");
  const [style, setStyle] = useState<SignatureStyle>("cursive");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const updatePreview = async (dataUrl: string) => {
    setPreviewUrl(dataUrl);
  };

  const exportTransparent = async () => {
    setBusy(true);
    try {
      let source = previewUrl;
      if (mode === "draw") {
        if (!padRef.current || padRef.current.isEmpty()) return;
        source = padRef.current.getTrimmedCanvas().toDataURL("image/png");
      } else {
        source = renderTypedSignature(typedName, style);
      }
      if (!source) return;
      const blob = await transparentPngFromDataUrl(source);
      downloadBlob(blob, "signature-transparent.png", "signature-maker");
      trackToolUse("signature-maker", { mode });
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolChrome
      title="Signature Maker — Transparent PNG"
      description="Draw or type your digital signature, pick a handwriting style, and export a transparent PNG. Use it on PDFs with our E-Sign tool."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex gap-2">
            <button type="button" onClick={() => setMode("draw")} className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium ${mode === "draw" ? "border-blue-500 bg-blue-50" : "border-slate-200"}`}>
              <PenLine className="h-4 w-4" /> Draw
            </button>
            <button type="button" onClick={() => setMode("type")} className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium ${mode === "type" ? "border-blue-500 bg-blue-50" : "border-slate-200"}`}>
              <Type className="h-4 w-4" /> Type
            </button>
          </div>

          {mode === "draw" ? (
            <>
              <div className="overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-white">
                <SignatureCanvas
                  ref={padRef}
                  penColor="#0f172a"
                  canvasProps={{ className: "h-44 w-full touch-none" }}
                  onEnd={() => {
                    if (padRef.current) void updatePreview(padRef.current.getTrimmedCanvas().toDataURL("image/png"));
                  }}
                />
              </div>
              <button type="button" onClick={() => { padRef.current?.clear(); setPreviewUrl(null); }} className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
                <Eraser className="h-4 w-4" /> Clear
              </button>
            </>
          ) : (
            <>
              <input value={typedName} onChange={(e) => { setTypedName(e.target.value); setPreviewUrl(renderTypedSignature(e.target.value, style)); }} placeholder="Your name" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
              <div className="flex flex-wrap gap-2">
                {STYLES.map((s) => (
                  <button key={s.id} type="button" onClick={() => { setStyle(s.id); setPreviewUrl(renderTypedSignature(typedName, s.id)); }} className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${style === s.id ? "border-blue-500 bg-blue-50" : "border-slate-200"}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900">Preview</p>
          <div className="flex min-h-[160px] items-center justify-center rounded-xl border border-slate-200 bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%,transparent_75%,#f1f5f9_75%),linear-gradient(45deg,#f1f5f9_25%,transparent_25%,transparent_75%,#f1f5f9_75%)] bg-[length:16px_16px] bg-[position:0_0,8px_8px] p-4">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Signature preview" className="max-h-36 max-w-full object-contain" />
            ) : (
              <p className="text-sm text-slate-500">Draw or type to preview</p>
            )}
          </div>
          <button type="button" disabled={busy || !previewUrl} onClick={() => void exportTransparent()} className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            <Download className="h-4 w-4" /> Download transparent PNG
          </button>
          <Link href="/tools/e-sign" className="block text-center text-sm font-medium text-blue-600 hover:underline">
            Stamp this signature on a PDF → E-Sign tool
          </Link>
        </aside>
      </div>
    </ToolChrome>
  );
}
