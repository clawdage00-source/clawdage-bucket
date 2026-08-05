"use client";

import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Download,
  FileText,
  Loader2,
  Lock,
  Minus,
  PenLine,
  Plus,
  Sparkles,
  Trash2,
  Type,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import SignatureCanvas from "react-signature-canvas";

import { trackToolUse } from "@/lib/analytics";
import { DailyPassUpsellModal } from "@/components/tools/daily-pass-upsell-modal";
import {
  buildSignedPdf,
  clickToImageStampPdfBox,
  clickToTextBaselinePdf,
  dataUrlToUint8Array,
  imageStampOverlayStyle,
  pngBytesToDataUrl,
  resizeImageStampCentered,
  textStampOverlayStyle,
  type ESignStamp,
  type ImageStamp,
  type TextStamp,
} from "@/lib/e-sign-export";
import {
  addSavedSignature,
  loadSavedSignatures,
  removeSavedSignature,
  type SavedSignature,
} from "@/lib/e-sign-saved-signatures";

// react-pdf ships pdfjs 5.4.x; top-level /pdf.worker.min.mjs is 5.7.x — keep them separate.
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.react-pdf.min.mjs";

const MAX_PDF_BYTES = 18 * 1024 * 1024;
const DEFAULT_ATTEST = "Self attested";
const SIGNATURE_SCALE_STEP = 1.12;

export type ESignToolProps = {
  isPro: boolean;
};

type PlacementMode = "idle" | "signature" | "date" | "attest";

function downloadUint8Array(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
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

function typedSignatureDataUrl(name: string): string {
  const w = 440;
  const h = 140;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) return "";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#0f172a";
  ctx.font = 'italic 52px "Brush Script MT", "Segoe Script", "Apple Chancery", cursive';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name.trim() || "Signature", w / 2, h / 2, w - 24);
  return c.toDataURL("image/png");
}

function naturalSizeFromDataUrl(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve({ w: im.naturalWidth, h: im.naturalHeight });
    im.onerror = () => reject(new Error("Could not read image"));
    im.src = dataUrl;
  });
}

/** Screen-space hit test: avoids placing a new signature on top of an existing one (e.g. after a drag). */
function isPointOverPageImageStamp(
  localX: number,
  localY: number,
  pageIndex: number,
  stampList: ESignStamp[],
  pagePt: { w: number; h: number },
  displayW: number,
  displayH: number,
): boolean {
  const pad = 12;
  for (const s of stampList) {
    if (s.pageIndex !== pageIndex || s.kind !== "image") continue;
    const left = (s.pdfX / pagePt.w) * displayW;
    const top = ((pagePt.h - s.pdfY - s.pdfH) / pagePt.h) * displayH;
    const w = (s.pdfW / pagePt.w) * displayW;
    const h = (s.pdfH / pagePt.h) * displayH;
    if (
      localX >= left - pad &&
      localX <= left + w + pad &&
      localY >= top - pad &&
      localY <= top + h + pad
    ) {
      return true;
    }
  }
  return false;
}

export function ESignTool({ isPro }: ESignToolProps) {
  const formId = useId();
  const sigRef = useRef<SignatureCanvas>(null);
  const dragPayloadRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ignorePointerUntilRef = useRef(0);
  const stampDragRef = useRef<{
    stampId: string;
    pageIndex: number;
    startClientX: number;
    startClientY: number;
    origPdfX: number;
    origPdfY: number;
    moved: boolean;
  } | null>(null);

  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  /** Blob URL for react-pdf only — avoids transferring/detaching the export buffer. */
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string>("document.pdf");
  const [numPages, setNumPages] = useState(0);
  const [pagePtSizes, setPagePtSizes] = useState<Record<number, { w: number; h: number }>>({});
  const [viewW, setViewW] = useState(520);

  const [sigTab, setSigTab] = useState<"draw" | "type">("draw");
  const [typedName, setTypedName] = useState("");
  const [activeSigDataUrl, setActiveSigDataUrl] = useState<string | null>(null);
  const [attestPhrase, setAttestPhrase] = useState(DEFAULT_ATTEST);

  const [placementMode, setPlacementMode] = useState<PlacementMode>("idle");
  const [stamps, setStamps] = useState<ESignStamp[]>([]);
  const [savedSigs, setSavedSigs] = useState<SavedSignature[]>([]);
  const [saveName, setSaveName] = useState("My sign");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upsellOpen, setUpsellOpen] = useState(false);

  useEffect(() => {
    setSavedSigs(loadSavedSignatures());
  }, []);

  useEffect(() => {
    if (!pdfBytes) {
      setPdfPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(new Blob([pdfBytes as BlobPart], { type: "application/pdf" }));
    setPdfPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
      setPdfPreviewUrl(null);
    };
  }, [pdfBytes]);

  useEffect(() => {
    function onResize() {
      const vw = typeof window !== "undefined" ? window.innerWidth : 520;
      setViewW(Math.min(560, Math.max(280, vw - 48)));
    }
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const freePageOnlyHint = useMemo(
    () => (!isPro ? "Free: place stamps on page 1 only. Daily Pass unlocks all pages." : null),
    [isPro],
  );

  const clearPdf = useCallback(() => {
    setPdfBytes(null);
    setNumPages(0);
    setPagePtSizes({});
    setStamps([]);
    setError(null);
    setPlacementMode("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const onPdfPick = useCallback(async (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    if (f.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }
    if (f.size > MAX_PDF_BYTES) {
      setError("PDF is too large (max ~18 MB for this tool).");
      return;
    }
    setError(null);
    const buf = new Uint8Array(await f.arrayBuffer());
    setPdfBytes(buf);
    setPdfName(f.name.replace(/\.pdf$/i, "") || "document");
    setStamps([]);
    setPlacementMode("idle");
  }, []);

  const ensurePageAllowed = useCallback(
    (pageIndex: number): boolean => {
      if (isPro) return true;
      if (pageIndex === 0) return true;
      setUpsellOpen(true);
      return false;
    },
    [isPro],
  );

  const addImageStamp = useCallback(
    async (pageIndex: number, dataUrl: string, rect: DOMRect, localX: number, localY: number) => {
      if (!pdfBytes) return;
      const pdfSize = pagePtSizes[pageIndex];
      if (!pdfSize) return;
      if (!ensurePageAllowed(pageIndex)) return;

      const { w: natW, h: natH } = await naturalSizeFromDataUrl(dataUrl);
      const ratio = natH / Math.max(1, natW);
      const stampPdfW = Math.min(130, pdfSize.w * 0.38);
      const stampPdfH = stampPdfW * ratio;
      const { pdfX, pdfY } = clickToImageStampPdfBox({
        clickLocalX: localX,
        clickLocalY: localY,
        displayW: rect.width,
        displayH: rect.height,
        pdfPageW: pdfSize.w,
        pdfPageH: pdfSize.h,
        stampPdfW,
        stampPdfH,
      });

      const pngBytes = dataUrlToUint8Array(dataUrl);
      const stamp: ImageStamp = {
        id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        kind: "image",
        pageIndex,
        pdfX: Math.max(0, Math.min(pdfX, pdfSize.w - stampPdfW)),
        pdfY: Math.max(0, Math.min(pdfY, pdfSize.h - stampPdfH)),
        pdfW: stampPdfW,
        pdfH: stampPdfH,
        pngBytes,
      };
      setStamps((s) => [...s, stamp]);
    },
    [ensurePageAllowed, pagePtSizes, pdfBytes],
  );

  const addTextStamp = useCallback(
    (pageIndex: number, text: string, fontSize: number, rect: DOMRect, localX: number, localY: number) => {
      const pdfSize = pagePtSizes[pageIndex];
      if (!pdfSize) return;
      if (!ensurePageAllowed(pageIndex)) return;
      const { pdfX, pdfY } = clickToTextBaselinePdf({
        clickLocalX: localX,
        clickLocalY: localY,
        displayW: rect.width,
        displayH: rect.height,
        pdfPageW: pdfSize.w,
        pdfPageH: pdfSize.h,
        fontSize,
      });
      const stamp: TextStamp = {
        id: `txt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        kind: "text",
        pageIndex,
        pdfX: Math.max(8, Math.min(pdfX, pdfSize.w - 40)),
        pdfY: Math.max(fontSize, Math.min(pdfY, pdfSize.h - 8)),
        text,
        fontSize,
      };
      setStamps((s) => [...s, stamp]);
    },
    [ensurePageAllowed, pagePtSizes],
  );

  const handlePagePointer = useCallback(
    async (pageIndex: number, e: React.PointerEvent<HTMLDivElement>) => {
      if (Date.now() < ignorePointerUntilRef.current) return;
      if (placementMode === "idle") return;
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;

      if (placementMode === "signature") {
        const pdfSize = pagePtSizes[pageIndex];
        if (
          pdfSize &&
          isPointOverPageImageStamp(localX, localY, pageIndex, stamps, pdfSize, rect.width, rect.height)
        ) {
          return;
        }
        const url = activeSigDataUrl ?? dragPayloadRef.current;
        if (!url) {
          setError("Create or select a signature first, then tap “Place signature”.");
          return;
        }
        await addImageStamp(pageIndex, url, rect, localX, localY);
        return;
      }
      if (placementMode === "date") {
        const d = format(new Date(), "dd MMM yyyy");
        addTextStamp(pageIndex, d, 11, rect, localX, localY);
        return;
      }
      if (placementMode === "attest") {
        addTextStamp(pageIndex, attestPhrase.trim() || DEFAULT_ATTEST, 10, rect, localX, localY);
      }
    },
    [activeSigDataUrl, addImageStamp, addTextStamp, attestPhrase, pagePtSizes, placementMode, stamps],
  );

  const onPageDrop = useCallback(
    async (pageIndex: number, e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      ignorePointerUntilRef.current = Date.now() + 500;
      const url = dragPayloadRef.current ?? activeSigDataUrl;
      if (!url) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;
      const pdfSize = pagePtSizes[pageIndex];
      if (
        pdfSize &&
        isPointOverPageImageStamp(localX, localY, pageIndex, stamps, pdfSize, rect.width, rect.height)
      ) {
        dragPayloadRef.current = null;
        return;
      }
      await addImageStamp(pageIndex, url, rect, localX, localY);
      dragPayloadRef.current = null;
    },
    [activeSigDataUrl, addImageStamp, pagePtSizes, stamps],
  );

  const captureDrawSignature = useCallback(() => {
    const c = sigRef.current;
    if (!c || c.isEmpty()) {
      setError("Draw your signature first.");
      return;
    }
    setError(null);
    setActiveSigDataUrl(c.toDataURL("image/png"));
  }, []);

  const captureTypedSignature = useCallback(() => {
    if (!typedName.trim()) {
      setError("Type your name for the signature.");
      return;
    }
    setError(null);
    setActiveSigDataUrl(typedSignatureDataUrl(typedName));
  }, [typedName]);

  const clearPad = useCallback(() => {
    sigRef.current?.clear();
  }, []);

  const persistCurrentSig = useCallback(() => {
    if (!isPro) {
      setUpsellOpen(true);
      return;
    }
    if (!activeSigDataUrl) {
      setError("Create a signature with Draw or Type, then tap “Save signature”.");
      return;
    }
    setSavedSigs(addSavedSignature(saveName, activeSigDataUrl));
    setSaveName("My sign");
  }, [activeSigDataUrl, isPro, saveName]);

  const exportPdf = useCallback(async () => {
    if (!pdfBytes) return;
    setBusy(true);
    setError(null);
    try {
      const out = await buildSignedPdf(pdfBytes, stamps, { watermarkFooter: !isPro });
      downloadUint8Array(out, `${pdfName}-signed.pdf`);
      trackToolUse("e-sign");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build PDF.");
    } finally {
      setBusy(false);
    }
  }, [isPro, pdfBytes, pdfName, stamps]);

  const adjustImageStampSize = useCallback(
    (id: string, direction: "larger" | "smaller") => {
      setStamps((prev) => {
        const stamp = prev.find((x) => x.id === id);
        if (!stamp || stamp.kind !== "image") return prev;
        const sz = pagePtSizes[stamp.pageIndex];
        if (!sz) return prev;
        const factor = direction === "larger" ? SIGNATURE_SCALE_STEP : 1 / SIGNATURE_SCALE_STEP;
        const next = resizeImageStampCentered(stamp, sz.w, sz.h, factor);
        return prev.map((x) => (x.id === id ? next : x));
      });
    },
    [pagePtSizes],
  );

  const onImageStampPointerDown = useCallback(
    (e: React.PointerEvent<HTMLImageElement>, stamp: ImageStamp, pageIndex: number) => {
      e.stopPropagation();
      if (e.pointerType === "mouse" && e.button !== 0) return;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      stampDragRef.current = {
        stampId: stamp.id,
        pageIndex,
        startClientX: e.clientX,
        startClientY: e.clientY,
        origPdfX: stamp.pdfX,
        origPdfY: stamp.pdfY,
        moved: false,
      };
    },
    [],
  );

  const onImageStampPointerMove = useCallback((e: React.PointerEvent<HTMLImageElement>) => {
    const d = stampDragRef.current;
    if (!d) return;
    if (Math.abs(e.clientX - d.startClientX) > 4 || Math.abs(e.clientY - d.startClientY) > 4) {
      d.moved = true;
    }
    const wrap = (e.currentTarget as HTMLElement).closest("[data-esign-page-wrap]") as HTMLElement | null;
    if (!wrap) return;
    const sz = pagePtSizes[d.pageIndex];
    if (!sz) return;
    const rect = wrap.getBoundingClientRect();
    const dx = e.clientX - d.startClientX;
    const dy = e.clientY - d.startClientY;
    const pdfDx = (dx / Math.max(1, rect.width)) * sz.w;
    const pdfDy = (-dy / Math.max(1, rect.height)) * sz.h;
    setStamps((prev) => {
      const cur = prev.find((s) => s.id === d.stampId && s.kind === "image") as ImageStamp | undefined;
      if (!cur) return prev;
      let newX = d.origPdfX + pdfDx;
      let newY = d.origPdfY + pdfDy;
      newX = Math.max(0, Math.min(newX, sz.w - cur.pdfW));
      newY = Math.max(0, Math.min(newY, sz.h - cur.pdfH));
      return prev.map((s) => (s.id === d.stampId && s.kind === "image" ? { ...s, pdfX: newX, pdfY: newY } : s));
    });
  }, [pagePtSizes]);

  const onImageStampPointerEnd = useCallback((e: React.PointerEvent<HTMLImageElement>) => {
    const session = stampDragRef.current;
    stampDragRef.current = null;
    if (session?.moved) {
      ignorePointerUntilRef.current = Date.now() + 900;
    } else {
      ignorePointerUntilRef.current = Date.now() + 350;
    }
    const el = e.currentTarget as HTMLElement;
    if (el.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
    e.stopPropagation();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-teal-50">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          <p className="text-center text-sm font-medium leading-relaxed text-emerald-950 sm:text-[15px]">
            <span aria-hidden className="mr-1">
              🔒
            </span>
            Your signature and documents never leave your browser. We do not store your private documents or
            signatures on our servers.
          </p>
        </div>
      </div>

      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-start gap-3">
            <Link
              href="/#tools"
              className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted"
              aria-label="Back to tools"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  Self-Attestation &amp; E-Sign
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                  <Sparkles className="h-3 w-3" aria-hidden />
                  Local PDF
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Draw or type a signature, add date or text, then click or drop on the preview to place it.
              </p>
              {freePageOnlyHint ? <p className="mt-2 text-xs text-amber-800">{freePageOnlyHint}</p> : null}
              {!isPro ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Free export includes a small footer line &quot;Signed via Clawdage&quot;.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        <input
          ref={fileInputRef}
          id={formId}
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={(e) => void onPdfPick(e.target.files)}
        />

        {!pdfBytes ? (
          <label
            htmlFor={formId}
            className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card px-4 py-12 text-center shadow-sm transition hover:border-border"
          >
            <FileText className="h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm font-semibold text-foreground">Upload a PDF (e.g. Aadhar copy)</p>
            <p className="mt-1 text-xs text-muted-foreground">Max ~18 MB. Everything stays in your browser.</p>
          </label>
        ) : null}

        {pdfBytes ? (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">Preview</p>
                <div className="flex flex-wrap gap-2">
                  <label
                    htmlFor={formId}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
                  >
                    Replace PDF
                  </label>
                  <button
                    type="button"
                    onClick={clearPdf}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Reset
                  </button>
                </div>
              </div>

              {pdfPreviewUrl ? (
                <Document
                  key={pdfPreviewUrl}
                  file={pdfPreviewUrl}
                  onLoadSuccess={({ numPages: n }) => {
                    setNumPages(n);
                    setPagePtSizes({});
                  }}
                  loading={
                    <div className="flex justify-center py-12 text-sm text-muted-foreground">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Loading PDF…
                    </div>
                  }
                  error={<div className="text-sm text-red-700">Could not open this PDF.</div>}
                  className="flex flex-col items-center"
                >
                  {Array.from({ length: numPages }, (_, idx) => (
                    <div key={idx} className="mb-6 w-full">
                      <p className="mb-2 text-center text-xs font-medium text-muted-foreground">Page {idx + 1}</p>
                      <div
                        data-esign-page-wrap
                        className={`relative mx-auto w-fit max-w-full rounded-lg border border-border bg-muted shadow-sm ${
                          placementMode !== "idle"
                            ? "ring-2 ring-emerald-400/80 ring-offset-2 cursor-crosshair"
                            : ""
                        }`}
                        role="presentation"
                        onPointerUp={(e) => {
                          if (e.pointerType === "mouse" && e.button !== 0) return;
                          if ((e.target as HTMLElement).closest("[data-esign-signature-overlay]")) return;
                          void handlePagePointer(idx, e);
                        }}
                        onDragOver={(e) => {
                          if (activeSigDataUrl || dragPayloadRef.current) {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "copy";
                          }
                        }}
                        onDrop={(e) => void onPageDrop(idx, e)}
                      >
                        <Page
                          pageNumber={idx + 1}
                          width={viewW}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                          onLoadSuccess={(page) => {
                            const v = page.getViewport({ scale: 1 });
                            setPagePtSizes((prev) => ({ ...prev, [idx]: { w: v.width, h: v.height } }));
                          }}
                        />
                        {pagePtSizes[idx] ? (
                          <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden rounded-lg select-none">
                            {stamps
                              .filter((s) => s.pageIndex === idx)
                              .map((s, stampIdx) => {
                                const sz = pagePtSizes[idx];
                                if (!sz) return null;
                                if (s.kind === "image") {
                                  return (
                                    <img
                                      key={s.id}
                                      data-esign-signature-overlay
                                      alt=""
                                      src={pngBytesToDataUrl(s.pngBytes)}
                                      style={{
                                        ...imageStampOverlayStyle(s, sz.w, sz.h),
                                        objectFit: "contain",
                                        pointerEvents: "auto",
                                        touchAction: "none",
                                        cursor: "grab",
                                        zIndex: 10 + stampIdx,
                                      }}
                                      className="active:cursor-grabbing"
                                      onPointerDown={(e) => onImageStampPointerDown(e, s, idx)}
                                      onPointerMove={onImageStampPointerMove}
                                      onPointerUp={onImageStampPointerEnd}
                                      onPointerCancel={onImageStampPointerEnd}
                                    />
                                  );
                                }
                                return (
                                  <div
                                    key={s.id}
                                    className="pointer-events-none"
                                    style={textStampOverlayStyle(s, sz.w, sz.h)}
                                  >
                                    {s.text}
                                  </div>
                                );
                              })}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </Document>
              ) : (
                <div className="flex justify-center py-12 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Preparing preview…
                </div>
              )}

              {stamps.length > 0 ? (
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Placed items</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Drag a placed signature to move it. Use − / + to resize. Download when ready.
                  </p>
                  <ul className="mt-2 space-y-2">
                    {stamps.map((s) => (
                      <li
                        key={s.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm"
                      >
                        <span className="min-w-0 flex-1 truncate text-foreground">
                          Page {s.pageIndex + 1} · {s.kind === "image" ? "Signature" : s.text}
                        </span>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {s.kind === "image" ? (
                            <>
                              <button
                                type="button"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40"
                                aria-label="Smaller signature"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  adjustImageStampSize(s.id, "smaller");
                                }}
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40"
                                aria-label="Larger signature"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  adjustImageStampSize(s.id, "larger");
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </>
                          ) : null}
                          <button
                            type="button"
                            className="text-xs font-medium text-red-700 hover:underline"
                            onClick={() => setStamps((prev) => prev.filter((x) => x.id !== s.id))}
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <button
                type="button"
                disabled={busy || stamps.length === 0}
                onClick={() => void exportPdf()}
                className="inline-flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Download signed PDF
              </button>
            </div>

            <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <p className="text-sm font-semibold text-foreground">Signature</p>
                <div className="mt-3 flex rounded-lg border border-border p-0.5 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setSigTab("draw")}
                    className={`flex flex-1 items-center justify-center gap-1 rounded-md py-2 ${
                      sigTab === "draw" ? "bg-foreground text-background" : "text-muted-foreground"
                    }`}
                  >
                    <PenLine className="h-3.5 w-3.5" />
                    Draw
                  </button>
                  <button
                    type="button"
                    onClick={() => setSigTab("type")}
                    className={`flex flex-1 items-center justify-center gap-1 rounded-md py-2 ${
                      sigTab === "type" ? "bg-foreground text-background" : "text-muted-foreground"
                    }`}
                  >
                    <Type className="h-3.5 w-3.5" />
                    Type
                  </button>
                </div>

                {sigTab === "draw" ? (
                  <div className="mt-3">
                    <div className="overflow-hidden rounded-xl border border-border bg-card">
                      <SignatureCanvas
                        ref={sigRef}
                        penColor="#0f172a"
                        backgroundColor="#ffffff"
                        clearOnResize={false}
                        canvasProps={{
                          className: "w-full max-w-full touch-none",
                          style: { height: 160, width: "100%", touchAction: "none" },
                        }}
                      />
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={clearPad}
                        className="flex-1 rounded-lg border border-border py-2 text-sm font-medium text-foreground hover:bg-muted"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={captureDrawSignature}
                        className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                      >
                        Save signature
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    <label className="block text-xs font-medium text-muted-foreground" htmlFor={`${formId}-typed`}>
                      Your name
                    </label>
                    <input
                      id={`${formId}-typed`}
                      value={typedName}
                      onChange={(e) => setTypedName(e.target.value)}
                      placeholder="As it should appear"
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                    />
                    <button
                      type="button"
                      onClick={captureTypedSignature}
                      className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                    >
                      Save signature
                    </button>
                  </div>
                )}

                {activeSigDataUrl ? (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Active signature (drag onto a page)</p>
                    <img
                      src={activeSigDataUrl}
                      alt="Active signature"
                      draggable
                      onDragStart={(e) => {
                        dragPayloadRef.current = activeSigDataUrl;
                        e.dataTransfer.effectAllowed = "copy";
                        e.dataTransfer.setData("text/plain", "esign-signature");
                      }}
                      onDragEnd={() => {
                        dragPayloadRef.current = null;
                      }}
                      className="max-h-24 w-auto cursor-grab rounded border border-border bg-card p-1 active:cursor-grabbing"
                    />
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">Save a signature to enable placement on the PDF.</p>
                )}
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <p className="text-sm font-semibold text-foreground">Place on PDF</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Choose a tool, then click (or drop your signature) on the page preview.
                </p>
                <div className="mt-3 grid gap-2">
                  <button
                    type="button"
                    onClick={() => setPlacementMode((m) => (m === "signature" ? "idle" : "signature"))}
                    disabled={!activeSigDataUrl}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium ${
                      placementMode === "signature"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-950"
                        : "border-border hover:bg-muted disabled:opacity-40"
                    }`}
                  >
                    <PenLine className="h-4 w-4" />
                    Place signature
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlacementMode((m) => (m === "date" ? "idle" : "date"))}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium ${
                      placementMode === "date"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-950"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <Calendar className="h-4 w-4" />
                    Place today&apos;s date
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlacementMode((m) => (m === "attest" ? "idle" : "attest"))}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium ${
                      placementMode === "attest"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-950"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <FileText className="h-4 w-4" />
                    Place text
                  </button>
                </div>
                {placementMode === "attest" ? (
                  <div className="mt-3">
                    <label className="text-xs font-medium text-muted-foreground" htmlFor={`${formId}-attest`}>
                      Text to stamp
                    </label>
                    <input
                      id={`${formId}-attest`}
                      value={attestPhrase}
                      onChange={(e) => setAttestPhrase(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                    />
                  </div>
                ) : null}
                {placementMode !== "idle" ? (
                  <button
                    type="button"
                    className="mt-3 w-full rounded-lg border border-border py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
                    onClick={() => setPlacementMode("idle")}
                  >
                    Cancel placement
                  </button>
                ) : null}
              </div>

              {isPro ? (
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Lock className="h-4 w-4 text-emerald-700" aria-hidden />
                    Saved signatures
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Stored only in this browser on this device.</p>
                  <div className="mt-3 flex gap-2">
                    <input
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      placeholder="Label"
                      className="min-w-0 flex-1 rounded-lg border border-border px-2 py-1.5 text-sm"
                    />
                    <button
                      type="button"
                      onClick={persistCurrentSig}
                      disabled={!activeSigDataUrl}
                      className="shrink-0 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-40"
                    >
                      Save
                    </button>
                  </div>
                  <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto text-sm">
                    {savedSigs.map((s) => (
                      <li key={s.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted px-2 py-1.5">
                        <button
                          type="button"
                          className="truncate text-left font-medium text-foreground hover:underline"
                          onClick={() => {
                            setActiveSigDataUrl(s.dataUrl);
                            setPlacementMode("signature");
                          }}
                        >
                          {s.name}
                        </button>
                        <button
                          type="button"
                          className="shrink-0 text-xs text-red-700 hover:underline"
                          onClick={() => setSavedSigs(removeSavedSignature(s.id))}
                        >
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-muted/80 p-4 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Daily Pass:</span> save multiple named signatures
                  (e.g. &quot;My sign&quot;, &quot;Dad&apos;s sign&quot;) in this browser — unlocks with an active pass.
                </div>
              )}
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</div>
        ) : null}
      </div>

      <DailyPassUpsellModal
        open={upsellOpen}
        onClose={() => setUpsellOpen(false)}
        title="Daily Pass — more pages and saved signs"
        description={
          <>
            Free signing is limited to <span className="font-medium text-foreground">page 1</span> and includes a small
            footer credit. A <span className="font-medium text-foreground">Daily Pass from ₹19</span> removes the
            watermark, lets you stamp <span className="font-medium text-foreground">every page</span>, and lets you save
            multiple signatures in this browser.
          </>
        }
        secondaryActionLabel="Close"
      />
    </div>
  );
}
