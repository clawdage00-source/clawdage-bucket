"use client";

import { jsPDF } from "jspdf";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Download,
  FileImage,
  FileStack,
  IdCard,
  LayoutGrid,
  Loader2,
  Maximize2,
  RotateCcw,
  RotateCw,
  Rows3,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useId, useMemo, useRef, useState } from "react";
import Cropper, { type Area, type MediaSize, type Point } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";

import { DailyPassUpsellModal } from "@/components/tools/daily-pass-upsell-modal";
import {
  applyWatermark,
  compressCanvasToMaxBytes,
  downloadBlob,
  renderCroppedRegion,
  stitchCanvasesHorizontal,
  stitchCanvasesVertical,
} from "@/lib/id-resizer-canvas";
import { computeFitFullImageCrop } from "@/lib/id-resizer-crop-fit";
import {
  aspectRatioOf,
  defaultMaxKbFor,
  DOCUMENT_PRESETS,
  getDocumentPreset,
  getPortalPreset,
  outputPixelsForDocument,
  PORTAL_PRESETS,
  type DocumentPresetId,
  type PortalPresetId,
} from "@/lib/indian-id-resizer-config";

const OUTPUT_DPI = 200;
const CROP_MIN_ZOOM = 0.12;
const CROP_MAX_ZOOM = 4;

function normDeg(n: number) {
  return ((Math.round(n) % 360) + 360) % 360;
}

type StepId = 1 | 2 | 3 | 4;

export type IdResizerToolProps = {
  isPro: boolean;
};

export function IdResizerTool({ isPro }: IdResizerToolProps) {
  const formId = useId();
  const cropContainerRef = useRef<HTMLDivElement>(null);
  const lastMediaSizeRef = useRef<MediaSize | null>(null);
  const [step, setStep] = useState<StepId>(1);
  const [docId, setDocId] = useState<DocumentPresetId>("aadhar");
  const [portalId, setPortalId] = useState<PortalPresetId>("ssc_upsc");
  const [maxKb, setMaxKb] = useState(50);
  const [stitchLayout, setStitchLayout] = useState<"vertical" | "horizontal">("vertical");

  const [frontSrc, setFrontSrc] = useState<string | null>(null);
  const [backSrc, setBackSrc] = useState<string | null>(null);
  const [cropSide, setCropSide] = useState<"front" | "back">("front");

  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const [savedFront, setSavedFront] = useState<{ area: Area; src: string; rotation: number } | null>(null);
  const [savedBack, setSavedBack] = useState<{ area: Area; src: string; rotation: number } | null>(null);

  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [upsellOpen, setUpsellOpen] = useState(false);

  const doc = useMemo(() => getDocumentPreset(docId), [docId]);
  const portal = useMemo(() => getPortalPreset(portalId), [portalId]);
  const aspect = useMemo(() => aspectRatioOf(doc), [doc]);
  const outPx = useMemo(() => outputPixelsForDocument(doc, OUTPUT_DPI), [doc]);

  const wantsDual = doc.supportsDualUpload && isPro;
  const activeSrc = cropSide === "front" ? frontSrc : backSrc;

  const fitFullPhotoFromMedia = useCallback(
    (mediaSize: MediaSize) => {
      const el = cropContainerRef.current;
      if (!el) return;
      const run = () => {
        const { clientWidth, clientHeight } = el;
        if (clientWidth < 24 || clientHeight < 24) return;
        try {
          const { crop: nc, zoom: nz } = computeFitFullImageCrop(
            mediaSize,
            clientWidth,
            clientHeight,
            aspect,
            CROP_MIN_ZOOM,
            CROP_MAX_ZOOM,
            rotation,
          );
          setCrop(nc);
          setZoom(nz);
        } catch {
          /* container not laid out yet */
        }
      };
      requestAnimationFrame(() => requestAnimationFrame(run));
    },
    [aspect, rotation],
  );

  const resetSession = useCallback(() => {
    if (frontSrc) URL.revokeObjectURL(frontSrc);
    if (backSrc) URL.revokeObjectURL(backSrc);
    setFrontSrc(null);
    setBackSrc(null);
    setSavedFront(null);
    setSavedBack(null);
    setCropSide("front");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    lastMediaSizeRef.current = null;
    setStep(1);
    setHint(null);
  }, [frontSrc, backSrc]);

  const onPickPortal = (id: PortalPresetId) => {
    setPortalId(id);
    const d = getDocumentPreset(docId);
    const p = getPortalPreset(id);
    setMaxKb(defaultMaxKbFor(d, p));
  };

  const onPickDoc = (id: DocumentPresetId) => {
    setDocId(id);
    const d = getDocumentPreset(id);
    const p = getPortalPreset(portalId);
    setMaxKb(defaultMaxKbFor(d, p));
    if (frontSrc) URL.revokeObjectURL(frontSrc);
    if (backSrc) URL.revokeObjectURL(backSrc);
    setFrontSrc(null);
    setBackSrc(null);
    setSavedFront(null);
    setSavedBack(null);
    setCropSide("front");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    lastMediaSizeRef.current = null;
    setStep(1);
  };

  const readFileToUrl = (file: File): string => URL.createObjectURL(file);

  const onFrontFile = (f: File | null) => {
    if (!f || !/^image\/(jpeg|png|webp)$/i.test(f.type)) {
      setHint("Use JPG, PNG, or WebP.");
      return;
    }
    if (frontSrc) URL.revokeObjectURL(frontSrc);
    setFrontSrc(readFileToUrl(f));
    setSavedFront(null);
    setRotation(0);
    setHint(null);
  };

  const onBackFile = (f: File | null) => {
    if (!f || !/^image\/(jpeg|png|webp)$/i.test(f.type)) {
      setHint("Use JPG, PNG, or WebP.");
      return;
    }
    if (!isPro) {
      setUpsellOpen(true);
      return;
    }
    if (backSrc) URL.revokeObjectURL(backSrc);
    setBackSrc(readFileToUrl(f));
    setSavedBack(null);
    setRotation(0);
    setHint(null);
  };

  const openUpsell = () => setUpsellOpen(true);

  const buildExportCanvas = useCallback(
    async (saved: { area: Area; src: string; rotation: number }, watermark: boolean): Promise<HTMLCanvasElement> => {
      const canvas = await renderCroppedRegion(saved.src, saved.area, outPx.width, outPx.height, saved.rotation);
      if (watermark) applyWatermark(canvas);
      return canvas;
    },
    [outPx.height, outPx.width],
  );

  const exportJpegUnderMax = async (canvas: HTMLCanvasElement, maxBytes: number) => {
    const { blob } = await compressCanvasToMaxBytes(canvas, maxBytes);
    if (portal.minPhotoKb && !doc.usesSignatureKbCap && blob.size < portal.minPhotoKb * 1024) {
      setHint(
        `Output is under ${portal.minPhotoKb} KB — some portals expect at least that size; increase quality or dimensions if uploads fail.`,
      );
    } else {
      setHint(null);
    }
    return blob;
  };

  const downloadPdfFromCanvas = (canvas: HTMLCanvasElement, name: string) => {
    const w = canvas.width;
    const h = canvas.height;
    const pdf = new jsPDF({
      orientation: w > h ? "landscape" : "portrait",
      unit: "px",
      format: [w, h],
    });
    const data = canvas.toDataURL("image/jpeg", 0.92);
    pdf.addImage(data, "JPEG", 0, 0, w, h, undefined, "FAST");
    pdf.save(name);
  };

  const handleDownloadJpg = async () => {
    const maxBytes = Math.max(5, maxKb) * 1024;
    const wm = !isPro;
    setBusy(true);
    try {
      if (wantsDual && savedFront && savedBack) {
        if (!isPro) {
          openUpsell();
          return;
        }
        const a = await buildExportCanvas(savedFront, false);
        const b = await buildExportCanvas(savedBack, false);
        const stitched =
          stitchLayout === "vertical" ? await stitchCanvasesVertical(a, b) : await stitchCanvasesHorizontal(a, b);
        const blob = await exportJpegUnderMax(stitched, maxBytes);
        downloadBlob(blob, `id-${doc.id}-combined.jpg`);
        return;
      }
      const single = savedFront ?? (savedBack && !wantsDual ? savedBack : null);
      if (!single) return;
      const canvas = await buildExportCanvas(single, wm);
      const blob = await exportJpegUnderMax(canvas, maxBytes);
      downloadBlob(blob, `id-${doc.id}.jpg`);
    } finally {
      setBusy(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!isPro) {
      openUpsell();
      return;
    }
    const maxBytes = Math.max(5, maxKb) * 1024;
    setBusy(true);
    try {
      let canvas: HTMLCanvasElement;
      if (wantsDual && savedFront && savedBack) {
        const a = await buildExportCanvas(savedFront, false);
        const b = await buildExportCanvas(savedBack, false);
        canvas =
          stitchLayout === "vertical" ? await stitchCanvasesVertical(a, b) : await stitchCanvasesHorizontal(a, b);
      } else {
        const single = savedFront ?? savedBack;
        if (!single) return;
        canvas = await buildExportCanvas(single, false);
      }
      const { canvas: compressed } = await compressCanvasToMaxBytes(canvas, maxBytes);
      downloadPdfFromCanvas(compressed, `id-${doc.id}.pdf`);
    } finally {
      setBusy(false);
    }
  };

  const confirmCurrentCrop = () => {
    if (!activeSrc || !croppedAreaPixels) return;
    const payload = { area: croppedAreaPixels, src: activeSrc, rotation };
    if (cropSide === "front") {
      setSavedFront(payload);
      if (wantsDual && backSrc) {
        setCropSide("back");
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
        setCroppedAreaPixels(null);
        return;
      }
      setStep(4);
      return;
    }
    setSavedBack(payload);
    setStep(4);
  };

  /** Ready when at least front crop exists; if Pro uploaded back, both crops are required. */
  const exportReady = Boolean(savedFront) && (!wantsDual || !backSrc || Boolean(savedBack));
  const dualCropReady = wantsDual && savedFront && savedBack;

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
          <Link
            href="/#tools"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-black"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All tools
          </Link>
          <p className="text-xs text-slate-500">
            {isPro ? "Pro: combine sides, PDF, no watermark" : "Free: one side · watermarked JPG"}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <h1 className="text-2xl font-bold tracking-tight text-black sm:text-3xl">Indian document resizer</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Aadhaar, PAN, passport photo, and signature presets with crop, KB limits for SSC, UPSC, NTA, and banking
            uploads. Your files stay in the browser.
          </p>
        </motion.div>

        {/* Step rail */}
        <ol className="mt-8 flex flex-wrap gap-2 text-xs font-semibold sm:gap-3 sm:text-sm">
          {(
            [
              [1, "Preset"],
              [2, "Upload"],
              [3, "Crop"],
              [4, "Download"],
            ] as const
          ).map(([n, label]) => (
            <li
              key={n}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 ${
                step === n ? "bg-black text-white" : step > n ? "bg-slate-200 text-black" : "bg-slate-100 text-slate-500"
              }`}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-[11px] sm:text-xs">
                {step > n ? <Check className="h-3.5 w-3.5" /> : n}
              </span>
              {label}
            </li>
          ))}
        </ol>

        <div className="mt-8 space-y-8">
          {step === 1 ? (
            <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2 text-slate-500">
                <LayoutGrid className="h-4 w-4" aria-hidden />
                <h2 className="text-sm font-bold uppercase tracking-wide">Document & portal</h2>
              </div>
              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor={`${formId}-doc`} className="text-sm font-medium text-black">
                    Document type
                  </label>
                  <select
                    id={`${formId}-doc`}
                    value={docId}
                    onChange={(e) => onPickDoc(e.target.value as DocumentPresetId)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3 text-sm text-black outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    {DOCUMENT_PRESETS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.label} ({d.widthCm}×{d.heightCm} cm)
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-slate-500">Aspect ratio matches the physical ID for accurate framing.</p>
                </div>
                <div>
                  <label htmlFor={`${formId}-portal`} className="text-sm font-medium text-black">
                    Portal preset
                  </label>
                  <select
                    id={`${formId}-portal`}
                    value={portalId}
                    onChange={(e) => onPickPortal(e.target.value as PortalPresetId)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3 text-sm text-black outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    {PORTAL_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-slate-500">{portal.description}</p>
                </div>
              </div>
              <div className="mt-6">
                <label htmlFor={`${formId}-kb`} className="text-sm font-medium text-black">
                  Max output size (KB)
                </label>
                <input
                  id={`${formId}-kb`}
                  type="number"
                  min={5}
                  max={5000}
                  value={maxKb}
                  onChange={(e) => setMaxKb(Number(e.target.value) || 50)}
                  className="mt-2 w-full max-w-xs rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm text-black outline-none focus:ring-2 focus:ring-slate-200"
                />
                <p className="mt-1 text-xs text-slate-500">
                  We compress JPEG quality (and scale if needed) until the file is under this limit.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </button>
            </section>
          ) : null}

          {step === 2 ? (
            <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2 text-slate-500">
                <Upload className="h-4 w-4" aria-hidden />
                <h2 className="text-sm font-bold uppercase tracking-wide">Upload</h2>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {doc.supportsDualUpload
                  ? isPro
                    ? "Upload front and back for a combined export, or only the front for a single file."
                    : "Free plan: upload one side at a time (front recommended). Upgrade to combine both sides."
                  : "Upload a clear photo or scan of your document."}
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4">
                  <p className="text-sm font-medium text-black">Front / single</p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="mt-3 block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-black file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
                    onChange={(e) => onFrontFile(e.target.files?.[0] ?? null)}
                  />
                </div>
                {doc.supportsDualUpload ? (
                  <div
                    className={`rounded-xl border border-dashed p-4 ${isPro ? "border-slate-200 bg-slate-50/50" : "border-slate-100 bg-slate-50 opacity-70"}`}
                  >
                    <p className="text-sm font-medium text-black">Back {isPro ? "" : "(Pro)"}</p>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={!isPro}
                      className="mt-3 block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-black file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white disabled:opacity-50"
                      onChange={(e) => {
                        if (!isPro) {
                          openUpsell();
                          e.target.value = "";
                          return;
                        }
                        onBackFile(e.target.files?.[0] ?? null);
                      }}
                    />
                    {!isPro ? (
                      <button type="button" onClick={openUpsell} className="mt-2 text-xs font-medium text-slate-600 underline">
                        Unlock back + combine with Daily Pass
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" onClick={() => setStep(1)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-black hover:bg-slate-50">
                  Back
                </button>
                <button
                  type="button"
                  disabled={!frontSrc}
                  onClick={() => {
                    if (!frontSrc) return;
                    setCropSide("front");
                    setCrop({ x: 0, y: 0 });
                    setZoom(1);
                    setRotation(0);
                    setCroppedAreaPixels(null);
                    setStep(3);
                  }}
                  className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-40"
                >
                  {wantsDual && !backSrc ? "Crop front" : "Adjust crop"}
                </button>
              </div>
            </section>
          ) : null}

          {step === 3 && activeSrc ? (
            <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-slate-500">
                  <IdCard className="h-4 w-4" aria-hidden />
                  <h2 className="text-sm font-bold uppercase tracking-wide">
                    Crop {wantsDual ? (cropSide === "front" ? "— front" : "— back") : ""}
                  </h2>
                </div>
                {wantsDual ? (
                  <p className="text-xs text-slate-500">
                    {cropSide === "front" ? "Front side" : "Back side"} · aspect {doc.widthCm}×{doc.heightCm} cm
                  </p>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Drag to reposition. Zoom out past 1× to see your whole upload — or use{" "}
                <span className="font-medium text-slate-700">Fit full photo</span> for a pre-cropped scan. Use{" "}
                <span className="font-medium text-slate-700">Rotate</span> if the card is sideways. The dashed frame is your ID
                safe area.
              </p>
              <div
                ref={cropContainerRef}
                className="relative mx-auto mt-4 h-[min(56vh,420px)] w-full max-w-xl overflow-hidden rounded-2xl bg-neutral-900"
              >
                <Cropper
                  image={activeSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={aspect}
                  minZoom={CROP_MIN_ZOOM}
                  maxZoom={CROP_MAX_ZOOM}
                  rotation={rotation}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                  onCropComplete={(_, area) => setCroppedAreaPixels(area)}
                  onCropAreaChange={(_, area) => setCroppedAreaPixels(area)}
                  onMediaLoaded={(ms) => {
                    lastMediaSizeRef.current = ms;
                    fitFullPhotoFromMedia(ms);
                  }}
                  restrictPosition={false}
                  showGrid={false}
                  classes={{
                    cropAreaClassName:
                      "!border-[3px] !border-white/95 !shadow-[inset_0_0_0_1px_rgba(0,0,0,0.35),0_0_0_9999px_rgba(0,0,0,0.45)]",
                    mediaClassName: "!max-h-none",
                  }}
                />
                <div className="pointer-events-none absolute inset-6 rounded-xl border border-dashed border-white/40" aria-hidden />
              </div>
              <div className="mx-auto mt-3 flex max-w-xl flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rotate</span>
                  <button
                    type="button"
                    onClick={() => setRotation((r) => normDeg(r - 90))}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-black hover:bg-slate-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                    -90°
                  </button>
                  <button
                    type="button"
                    onClick={() => setRotation((r) => normDeg(r + 90))}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-black hover:bg-slate-50"
                  >
                    +90°
                    <RotateCw className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRotation(0)}
                    className="text-xs font-semibold text-slate-600 underline hover:text-black"
                  >
                    Reset angle
                  </button>
                </div>
                <div className="min-w-0 flex-1 sm:max-w-xs">
                  <label htmlFor={`${formId}-rot`} className="text-xs font-medium text-slate-600">
                    Fine angle ({normDeg(rotation)}°)
                  </label>
                  <input
                    id={`${formId}-rot`}
                    type="range"
                    min={0}
                    max={359}
                    value={normDeg(rotation)}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="mt-1 w-full accent-black"
                  />
                </div>
              </div>
              <div className="mx-auto mt-4 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0 flex-1">
                  <label htmlFor={`${formId}-zoom`} className="text-xs font-medium text-slate-600">
                    Zoom ({zoom.toFixed(2)}×)
                  </label>
                  <input
                    id={`${formId}-zoom`}
                    type="range"
                    min={CROP_MIN_ZOOM}
                    max={CROP_MAX_ZOOM}
                    step={0.01}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="mt-1 w-full accent-black"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const ms = lastMediaSizeRef.current;
                    if (ms) fitFullPhotoFromMedia(ms);
                  }}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-slate-50"
                >
                  <Maximize2 className="h-4 w-4" aria-hidden />
                  Fit full photo
                </button>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" onClick={() => setStep(2)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-black hover:bg-slate-50">
                  Back
                </button>
                <button
                  type="button"
                  disabled={!croppedAreaPixels}
                  onClick={confirmCurrentCrop}
                  className="inline-flex items-center gap-2 rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-40"
                >
                  {wantsDual && cropSide === "front" && backSrc ? (
                    <>
                      Next: crop back
                      <ArrowRight className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Continue to download
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </section>
          ) : null}

          {step === 3 && !activeSrc ? (
            <p className="text-sm text-red-600">Missing image — go back to upload.</p>
          ) : null}

          {step === 4 ? (
            <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2 text-slate-500">
                <Download className="h-4 w-4" aria-hidden />
                <h2 className="text-sm font-bold uppercase tracking-wide">Download</h2>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Output ≈ {outPx.width}×{outPx.height}px per side @ {OUTPUT_DPI} DPI from your cm preset, then compressed to
                under {maxKb} KB.
              </p>
              {wantsDual && savedFront && savedBack ? (
                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Combine layout</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setStitchLayout("vertical")}
                      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
                        stitchLayout === "vertical" ? "bg-black text-white" : "bg-white text-black ring-1 ring-slate-200"
                      }`}
                    >
                      <Rows3 className="h-4 w-4" />
                      Vertical
                    </button>
                    <button
                      type="button"
                      onClick={() => setStitchLayout("horizontal")}
                      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
                        stitchLayout === "horizontal" ? "bg-black text-white" : "bg-white text-black ring-1 ring-slate-200"
                      }`}
                    >
                      <FileStack className="h-4 w-4" />
                      Horizontal
                    </button>
                  </div>
                </div>
              ) : null}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  disabled={busy || !exportReady}
                  onClick={() => void handleDownloadJpg()}
                  className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-40"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileImage className="h-4 w-4" />}
                  {dualCropReady ? "Download combined JPG" : "Download JPG"}
                </button>
                <button
                  type="button"
                  disabled={busy || !exportReady}
                  onClick={() => void handleDownloadPdf()}
                  className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-slate-50 disabled:opacity-40"
                >
                  <FileStack className="h-4 w-4" />
                  Download PDF
                </button>
              </div>
              {!isPro ? <p className="mt-2 text-xs text-slate-500">Free JPG includes a light watermark. PDF and combined sides require a pass.</p> : null}
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" onClick={() => {
                  if (savedFront) {
                    setCropSide("front");
                    setRotation(savedFront.rotation);
                  } else if (savedBack) {
                    setCropSide("back");
                    setRotation(savedBack.rotation);
                  }
                  setCroppedAreaPixels(null);
                  setStep(3);
                }} className="text-sm font-medium text-slate-600 underline">
                  Re-adjust crop
                </button>
                <button type="button" onClick={resetSession} className="text-sm font-medium text-slate-600 underline">
                  Start over
                </button>
              </div>
            </section>
          ) : null}
        </div>

        <AnimatePresence>
          {hint ? (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-900"
            >
              {hint}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>

      <DailyPassUpsellModal
        open={upsellOpen}
        onClose={() => setUpsellOpen(false)}
        title="Combine, PDF & back side — Pro"
        description={
          <>
            A <span className="font-medium text-black">Daily Pass from ₹19</span> unlocks back-side upload, automatic
            front/back stitching, PDF export, and watermark-free JPGs.
          </>
        }
        secondaryActionLabel="Continue with free"
      />
    </div>
  );
}
