/** Physical size in centimetres (Indian ID / portal norms). */
export type DocumentPresetId = "aadhar" | "pan" | "passport_photo" | "signature";

export type DocumentPreset = {
  id: DocumentPresetId;
  label: string;
  widthCm: number;
  heightCm: number;
  /** Two-sided scan (front + back). */
  supportsDualUpload: boolean;
  /** Uses portal “signature” KB cap when applicable. */
  usesSignatureKbCap: boolean;
};

export const DOCUMENT_PRESETS: DocumentPreset[] = [
  { id: "aadhar", label: "Aadhaar card", widthCm: 8.5, heightCm: 5.5, supportsDualUpload: true, usesSignatureKbCap: false },
  { id: "pan", label: "PAN card", widthCm: 8.6, heightCm: 5.4, supportsDualUpload: false, usesSignatureKbCap: false },
  {
    id: "passport_photo",
    label: "Passport photo",
    widthCm: 3.5,
    heightCm: 4.5,
    supportsDualUpload: false,
    usesSignatureKbCap: false,
  },
  {
    id: "signature",
    label: "Signature",
    widthCm: 3.5,
    heightCm: 1.5,
    supportsDualUpload: false,
    usesSignatureKbCap: true,
  },
];

export type PortalPresetId = "ssc_upsc" | "nta" | "banking";

export type PortalPreset = {
  id: PortalPresetId;
  label: string;
  description: string;
  /** Max size for photo-style documents (Aadhaar, PAN, passport photo). */
  maxPhotoKb: number;
  /** Max size for signature preset (SSC/UPSC style). */
  maxSignKb: number;
  /** Max for generic ID when portal does not split photo/sign (banking). */
  maxIdKb: number;
  /** NTA: portals expect photo roughly within this band (we still cap at maxPhotoKb). */
  minPhotoKb?: number;
};

export const PORTAL_PRESETS: PortalPreset[] = [
  {
    id: "ssc_upsc",
    label: "SSC / UPSC",
    description: "Photo under 50 KB · Signature under 20 KB",
    maxPhotoKb: 50,
    maxSignKb: 20,
    maxIdKb: 50,
  },
  {
    id: "nta",
    label: "NTA (exams)",
    description: "Photo typically 10 KB – 200 KB",
    maxPhotoKb: 200,
    maxSignKb: 50,
    maxIdKb: 200,
    minPhotoKb: 10,
  },
  {
    id: "banking",
    label: "Banking",
    description: "ID uploads under 500 KB",
    maxPhotoKb: 500,
    maxSignKb: 500,
    maxIdKb: 500,
  },
];

export function getDocumentPreset(id: DocumentPresetId): DocumentPreset {
  const p = DOCUMENT_PRESETS.find((d) => d.id === id);
  if (!p) return DOCUMENT_PRESETS[0]!;
  return p;
}

export function getPortalPreset(id: PortalPresetId): PortalPreset {
  const p = PORTAL_PRESETS.find((x) => x.id === id);
  if (!p) return PORTAL_PRESETS[0]!;
  return p;
}

export function aspectRatioOf(doc: DocumentPreset): number {
  return doc.widthCm / doc.heightCm;
}

const CM_PER_INCH = 2.54;

/** Pixel size from centimetres at given DPI (print / portal fidelity). */
export function cmToPixels(cm: number, dpi: number): number {
  return Math.max(32, Math.round((cm / CM_PER_INCH) * dpi));
}

export function outputPixelsForDocument(doc: DocumentPreset, dpi: number): { width: number; height: number } {
  return {
    width: cmToPixels(doc.widthCm, dpi),
    height: cmToPixels(doc.heightCm, dpi),
  };
}

/** Default max KB from portal + document role. */
export function defaultMaxKbFor(doc: DocumentPreset, portal: PortalPreset): number {
  if (doc.usesSignatureKbCap) {
    return portal.maxSignKb;
  }
  if (portal.id === "banking") {
    return portal.maxIdKb;
  }
  return portal.maxPhotoKb;
}
