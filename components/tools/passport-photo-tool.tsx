"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Download,
  Grid3x3,
  ImageIcon,
  Loader2,
  Lock,
  RefreshCw,
  Trash2,
  User,
} from "lucide-react";
import { jsPDF } from "jspdf";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState, type SyntheticEvent } from "react";
import ReactCrop, { centerCrop, makeAspectCrop, type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

import { DailyPassUpsellModal } from "@/components/tools/daily-pass-upsell-modal";
import {
  BG_COLORS,
  type BgKey,
  canvasFromImageCrop,
  canvasToJpegBlob,
  canvasToPngBlob,
  cropDisplayToNatural,
  drawDiagonalWatermark,
  type CropPixelRect,
  paintPassportOnBackground,
  PASSPORT_ASPECT,
  PASSPORT_H_PX,
  PASSPORT_W_PX,
  pixelsToPdfPt,
  SHEET_4x6,
  SHEET_A4,
  tilePassportOntoSheet,
} from "@/lib/passport-photo-export";

export type PassportPhotoToolProps = {
  isPro: boolean;
};

type LayoutMode = "individual" | "sheet8" | "sheet16";

function downloadBlob(blob: Blob, filename: string) {
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

function downloadPdfFromCanvas(canvas: HTMLCanvasElement, filename: string) {
  const wPt = pixelsToPdfPt(canvas.width);
  const hPt = pixelsToPdfPt(canvas.height);
  const orientation = canvas.height >= canvas.width ? "portrait" : "landscape";
  const pdf = new jsPDF({
    orientation,
    unit: "pt",
    format: [wPt, hPt],
  });
  const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
  pdf.addImage(dataUrl, "JPEG", 0, 0, wPt, hPt, undefined, "SLOW");
  pdf.save(filename);
}

export function PassportPhotoTool({ isPro }: PassportPhotoToolProps) {
  const formId = useId();
  const sourceImgRef = useRef<HTMLImageElement | null>(null);
  const passportImgRef = useRef<HTMLImageElement | null>(null);

  const [rawPreview, setRawPreview] = useState<string | null>(null);
  const [noBgUrl, setNoBgUrl] = useState<string | null>(null);
  const [step, setStep] = useState<"pick" | "sourceCrop" | "removing" | "crop">("pick");
  const [sourceCrop, setSourceCrop] = useState<Crop | undefined>(undefined);
  const [passportCrop, setPassportCrop] = useState<Crop | undefined>(undefined);
  const [sourceCroppedPixels, setSourceCroppedPixels] = useState<CropPixelRect | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropPixelRect | null>(null);
  const [removeHint, setRemoveHint] = useState<string | null>(null);
  const [removePct, setRemovePct] = useState(0);
  const [bgKey, setBgKey] = useState<BgKey>("white");
  const [layout, setLayout] = useState<LayoutMode>("individual");
  const [busyExport, setBusyExport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upsellOpen, setUpsellOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (rawPreview) URL.revokeObjectURL(rawPreview);
      if (noBgUrl) URL.revokeObjectURL(noBgUrl);
    };
  }, [rawPreview, noBgUrl]);

  useEffect(() => {
    if (step !== "sourceCrop" || !sourceCrop || !rawPreview) return;
    const img = sourceImgRef.current;
    if (!img?.complete || img.naturalWidth === 0) return;
    setSourceCroppedPixels(cropDisplayToNatural(sourceCrop, img));
  }, [sourceCrop, step, rawPreview]);

  useEffect(() => {
    if (step !== "crop" || !passportCrop || !noBgUrl) return;
    const img = passportImgRef.current;
    if (!img?.complete || img.naturalWidth === 0) return;
    setCroppedAreaPixels(cropDisplayToNatural(passportCrop, img));
  }, [passportCrop, step, noBgUrl]);

  const clearAll = useCallback(() => {
    if (rawPreview) URL.revokeObjectURL(rawPreview);
    if (noBgUrl) URL.revokeObjectURL(noBgUrl);
    setRawPreview(null);
    setNoBgUrl(null);
    setStep("pick");
    setSourceCrop(undefined);
    setPassportCrop(undefined);
    setSourceCroppedPixels(null);
    setCroppedAreaPixels(null);
    setRemoveHint(null);
    setRemovePct(0);
    setError(null);
    setLayout("individual");
  }, [rawPreview, noBgUrl]);

  const runRemoveBg = useCallback(async (file: File) => {
    setNoBgUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPassportCrop(undefined);
    setCroppedAreaPixels(null);
    setStep("removing");
    setRemoveHint("Loading AI model…");
    setRemovePct(2);
    setError(null);
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(file, {
        progress: (key, current, total) => {
          setRemoveHint(key.replace(/_/g, " "));
          const t = Math.max(1, total);
          setRemovePct(Math.min(99, Math.round((current / t) * 100)));
        },
        output: { format: "image/png" },
      });
      const url = URL.createObjectURL(blob);
      setNoBgUrl(url);
      setRemovePct(100);
      setPassportCrop(undefined);
      setCroppedAreaPixels(null);
      setStep("crop");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Background removal failed: ${msg}`);
      setStep(rawPreview ? "sourceCrop" : "pick");
    } finally {
      setRemoveHint(null);
    }
  }, [rawPreview]);

  const continueToBackgroundRemoval = useCallback(async () => {
    if (!rawPreview || !sourceCroppedPixels) {
      setError("Adjust the crop on your photo first, then continue.");
      return;
    }
    setError(null);
    try {
      const subjectCanvas = await canvasFromImageCrop(rawPreview, sourceCroppedPixels);
      const blob = await canvasToPngBlob(subjectCanvas);
      if (!blob) {
        setError("Could not prepare the cropped image.");
        return;
      }
      const file = new File([blob], "subject.png", { type: "image/png" });
      await runRemoveBg(file);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [rawPreview, sourceCroppedPixels, runRemoveBg]);

  const onPickFile = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file || !file.type.startsWith("image/")) {
      setError("Please choose a JPG or PNG selfie.");
      return;
    }
    if (rawPreview) URL.revokeObjectURL(rawPreview);
    if (noBgUrl) URL.revokeObjectURL(noBgUrl);
    setNoBgUrl(null);
    setSourceCrop(undefined);
    setPassportCrop(undefined);
    setSourceCroppedPixels(null);
    setCroppedAreaPixels(null);
    const url = URL.createObjectURL(file);
    setRawPreview(url);
    setStep("sourceCrop");
  };

  const handleSourceImageLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const { width, height } = img;
    setSourceCrop(centerCrop({ unit: "%", width: 85, height: 78 }, width, height));
  };

  const handlePassportImageLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const { width, height } = img;
    setPassportCrop(
      centerCrop(makeAspectCrop({ unit: "%", width: 72 }, PASSPORT_ASPECT, width, height), width, height),
    );
  };

  const buildPassportCanvas = useCallback(async (): Promise<HTMLCanvasElement> => {
    if (!noBgUrl || !croppedAreaPixels) {
      throw new Error("Adjust the passport crop first (drag corners or edges, then export).");
    }
    const cropped = await canvasFromImageCrop(noBgUrl, croppedAreaPixels);
    const bg = BG_COLORS[bgKey];
    const passport = paintPassportOnBackground(cropped, { r: bg.r, g: bg.g, b: bg.b }, PASSPORT_W_PX, PASSPORT_H_PX);
    if (!isPro) {
      const ctx = passport.getContext("2d");
      if (ctx) drawDiagonalWatermark(ctx, passport.width, passport.height);
    }
    return passport;
  }, [noBgUrl, croppedAreaPixels, bgKey, isPro]);

  const handleExportJpeg = async () => {
    if (!isPro && (layout === "sheet8" || layout === "sheet16")) {
      setUpsellOpen(true);
      return;
    }
    setBusyExport(true);
    setError(null);
    try {
      const passport = await buildPassportCanvas();
      if (layout === "individual") {
        const blob = await canvasToJpegBlob(passport);
        if (!blob) throw new Error("Could not encode JPEG.");
        downloadBlob(blob, "passport-photo-35x45.jpg");
        return;
      }
      const spec = layout === "sheet8" ? SHEET_4x6 : SHEET_A4;
      const sheet = tilePassportOntoSheet(
        passport,
        spec.paperW,
        spec.paperH,
        spec.cols,
        spec.rows,
        10,
      );
      const blob = await canvasToJpegBlob(sheet);
      if (!blob) throw new Error("Could not encode sheet JPEG.");
      const name = layout === "sheet8" ? "passport-sheet-4x6-8up.jpg" : "passport-sheet-a4-16up.jpg";
      downloadBlob(blob, name);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyExport(false);
    }
  };

  const handleExportPdf = async () => {
    if (!isPro && (layout === "sheet8" || layout === "sheet16")) {
      setUpsellOpen(true);
      return;
    }
    setBusyExport(true);
    setError(null);
    try {
      const passport = await buildPassportCanvas();
      if (layout === "individual") {
        downloadPdfFromCanvas(passport, "passport-photo-35x45.pdf");
        return;
      }
      const spec = layout === "sheet8" ? SHEET_4x6 : SHEET_A4;
      const sheet = tilePassportOntoSheet(
        passport,
        spec.paperW,
        spec.paperH,
        spec.cols,
        spec.rows,
        10,
      );
      const name = layout === "sheet8" ? "passport-sheet-4x6-8up.pdf" : "passport-sheet-a4-16up.pdf";
      downloadPdfFromCanvas(sheet, name);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyExport(false);
    }
  };

  const tryLayout = (next: LayoutMode) => {
    if (!isPro && (next === "sheet8" || next === "sheet16")) {
      setUpsellOpen(true);
      return;
    }
    setLayout(next);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-white pb-24">
      <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-[90rem] flex-wrap items-center justify-between gap-3">
          <Link
            href="/#tools"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-black"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All tools
          </Link>
          <p className="text-xs text-slate-500">
            {isPro ? "Pro: print sheets & watermark-free export" : "Free: AI cutout + crop · watermark on download · sheets need Daily Pass"}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold tracking-tight text-black sm:text-3xl">Passport Photo Maker</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
            First crop your upload with the corner and edge handles (great for group photos), then we remove the
            background. Finish with a fixed 3.5×4.5 cm passport frame — same drag handles — and print-ready JPEG/PDF at
            300 DPI.
          </p>
        </motion.div>

        <div className="mt-8 space-y-6">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-black">1. Upload selfie</p>
            <p className="mt-1 text-xs text-slate-500">
              JPG or PNG · step 2 uses free-form crop; step 4 keeps passport aspect while you resize from any corner.
            </p>
            <input
              id={`${formId}-file`}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={step === "removing"}
              onChange={(e) => {
                void onPickFile(e.target.files);
                e.target.value = "";
              }}
            />
            <label
              htmlFor={`${formId}-file`}
              className={`mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 ${
                step === "removing" ? "pointer-events-none opacity-50" : ""
              }`}
            >
              <ImageIcon className="h-4 w-4" aria-hidden />
              {rawPreview ? "Replace photo" : "Choose photo"}
            </label>
          </div>

          <AnimatePresence>
            {step === "removing" ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-5"
              >
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin text-slate-700" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold text-black">3. Removing background…</p>
                    <p className="text-xs text-slate-600">{removeHint ?? "Preparing portrait AI…"}</p>
                  </div>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-black transition-[width] duration-300"
                    style={{ width: `${removePct}%` }}
                  />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {step === "sourceCrop" && rawPreview ? (
            <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-black">2. Crop to one person</p>
              <p className="mt-1 text-xs text-slate-500">
                Drag the corners or edges of the box to include only the subject. Move the whole box by dragging inside
                it. Then continue — background removal runs on this region only.
              </p>
              <div className="flex justify-center overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 py-3">
                {sourceCrop ? (
                  <ReactCrop
                    crop={sourceCrop}
                    onChange={(_, percentCrop) => setSourceCrop(percentCrop)}
                    keepSelection
                    ruleOfThirds
                    minWidth={32}
                    minHeight={32}
                  >
                    <img
                      ref={sourceImgRef}
                      src={rawPreview}
                      alt="Crop to subject"
                      className="block max-h-[min(52vh,480px)] w-auto max-w-full"
                    />
                  </ReactCrop>
                ) : (
                  <img
                    ref={sourceImgRef}
                    src={rawPreview}
                    alt="Crop to subject"
                    className="block max-h-[min(52vh,480px)] w-auto max-w-full"
                    onLoad={handleSourceImageLoad}
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => void continueToBackgroundRemoval()}
                className="mt-2 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 sm:w-auto"
              >
                Continue — remove background
              </button>
            </div>
          ) : null}

          {step === "crop" && noBgUrl ? (
            <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-black">4. Passport frame (3.5∶4.5)</p>
              <p className="text-xs text-slate-500">
                Resize from any corner or edge — aspect stays 3.5∶4.5. Drag inside the box to move it. Use the oval as
                a rough face guide.
              </p>
              <div className="relative flex justify-center overflow-x-auto rounded-xl border border-slate-200 bg-slate-900/90 py-3">
                {passportCrop ? (
                  <ReactCrop
                    crop={passportCrop}
                    aspect={PASSPORT_ASPECT}
                    onChange={(_, percentCrop) => setPassportCrop(percentCrop)}
                    keepSelection
                    ruleOfThirds
                    minWidth={40}
                    minHeight={40}
                  >
                    <img
                      ref={passportImgRef}
                      src={noBgUrl}
                      alt="Passport crop"
                      className="block max-h-[min(52vh,480px)] w-auto max-w-full"
                    />
                  </ReactCrop>
                ) : (
                  <img
                    ref={passportImgRef}
                    src={noBgUrl}
                    alt="Passport crop"
                    className="block max-h-[min(52vh,480px)] w-auto max-w-full"
                    onLoad={handlePassportImageLoad}
                  />
                )}
                <div
                  className="pointer-events-none absolute inset-0 flex items-center justify-center"
                  aria-hidden
                >
                  <div className="h-[58%] w-[72%] rounded-[50%] border-2 border-white/45 shadow-[0_0_0_1px_rgba(0,0,0,0.35)]" />
                </div>
                <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/55 px-2 py-1 text-[10px] font-medium text-white">
                  <User className="h-3 w-3" aria-hidden />
                  Face guide
                </div>
              </div>

              <p className="pt-2 text-sm font-semibold text-black">Background color</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(Object.keys(BG_COLORS) as BgKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setBgKey(key)}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      bgKey === key ? "border-black ring-2 ring-black/10" : "border-slate-200 hover:bg-slate-50"
                    }`}
                    style={{
                      backgroundColor: `rgb(${BG_COLORS[key].r},${BG_COLORS[key].g},${BG_COLORS[key].b})`,
                      color: "#0f172a",
                    }}
                  >
                    {BG_COLORS[key].label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === "crop" && noBgUrl ? (
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-black">5. Export</p>
              <p className="mt-1 text-xs text-slate-500">
                {PASSPORT_W_PX}×{PASSPORT_H_PX}px (300 DPI) · JPEG or PDF
              </p>

              <fieldset className="mt-4 space-y-2">
                <legend className="sr-only">Output layout</legend>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-3 has-[:checked]:border-black has-[:checked]:bg-slate-50">
                  <input
                    type="radio"
                    name={`${formId}-layout`}
                    checked={layout === "individual"}
                    onChange={() => tryLayout("individual")}
                    className="accent-black"
                  />
                  <span className="text-sm font-medium text-black">Individual passport photo</span>
                </label>
                <label
                  className={`flex items-center gap-3 rounded-xl border px-3 py-3 ${
                    isPro
                      ? "cursor-pointer border-slate-200 has-[:checked]:border-black has-[:checked]:bg-slate-50"
                      : "cursor-pointer border-amber-100 bg-amber-50/40"
                  }`}
                >
                  <input
                    type="radio"
                    name={`${formId}-layout`}
                    checked={layout === "sheet8"}
                    onChange={() => tryLayout("sheet8")}
                    className="accent-black"
                  />
                  <Grid3x3 className="h-4 w-4 shrink-0 text-slate-600" aria-hidden />
                  <span className="flex-1 text-sm font-medium text-black">Printable sheet — 8 photos on 4×6″</span>
                  {!isPro ? <Lock className="h-4 w-4 shrink-0 text-amber-700" aria-hidden /> : null}
                </label>
                <label
                  className={`flex items-center gap-3 rounded-xl border px-3 py-3 ${
                    isPro
                      ? "cursor-pointer border-slate-200 has-[:checked]:border-black has-[:checked]:bg-slate-50"
                      : "cursor-pointer border-amber-100 bg-amber-50/40"
                  }`}
                >
                  <input
                    type="radio"
                    name={`${formId}-layout`}
                    checked={layout === "sheet16"}
                    onChange={() => tryLayout("sheet16")}
                    className="accent-black"
                  />
                  <Grid3x3 className="h-4 w-4 shrink-0 text-slate-600" aria-hidden />
                  <span className="flex-1 text-sm font-medium text-black">Printable sheet — 16 photos on A4</span>
                  {!isPro ? <Lock className="h-4 w-4 shrink-0 text-amber-700" aria-hidden /> : null}
                </label>
              </fieldset>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={busyExport || !croppedAreaPixels}
                  onClick={() => void handleExportJpeg()}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-40"
                >
                  {busyExport ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Download className="h-4 w-4" aria-hidden />}
                  Download JPEG
                </button>
                <button
                  type="button"
                  disabled={busyExport || !croppedAreaPixels}
                  onClick={() => void handleExportPdf()}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-black transition hover:bg-slate-50 disabled:opacity-40"
                >
                  Download PDF
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-black transition hover:bg-slate-50"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  Clear
                </button>
                <button
                  type="button"
                  disabled={step !== "crop" || !rawPreview || !sourceCroppedPixels}
                  onClick={() => {
                    void (async () => {
                      if (!rawPreview || !sourceCroppedPixels) return;
                      const subjectCanvas = await canvasFromImageCrop(rawPreview, sourceCroppedPixels);
                      const blob = await canvasToPngBlob(subjectCanvas);
                      if (!blob) return;
                      await runRemoveBg(new File([blob], "subject.png", { type: "image/png" }));
                    })();
                  }}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-black transition hover:bg-slate-50 disabled:opacity-40"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden />
                  Re-run AI
                </button>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-900">{error}</div>
          ) : null}
        </div>
      </div>

      <DailyPassUpsellModal
        open={upsellOpen}
        onClose={() => setUpsellOpen(false)}
        title="Printable passport sheets (Pro)"
        description={
          <>
            Unlock <span className="font-medium text-black">8-up 4×6″</span> and{" "}
            <span className="font-medium text-black">16-up A4</span> grids,{" "}
            <span className="font-medium text-black">no watermark</span> exports, with a{" "}
            <span className="font-medium text-black">Daily Pass from ₹19</span>.
          </>
        }
        secondaryActionLabel="Continue with free"
      />
    </div>
  );
}
