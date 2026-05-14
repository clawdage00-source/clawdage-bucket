/** Public site name for titles, Open Graph, and JSON-LD. */
export const SITE_NAME = "Clawdage";

export const SITE_TAGLINE =
  "Privacy-first PDF, image, and AI utilities for India — run in your browser with optional daily passes from ₹19.";

/** Default when a page does not override `description`. */
export const DEFAULT_DESCRIPTION = `${SITE_NAME}: merge & compress PDFs, remove backgrounds, passport photos, Aadhar/PAN resizing, OCR, QR codes, and more. No server uploads for supported tools; passes for Pro features.`;

export function buildGlobalKeywords(): string {
  const toolPhrases = [
    "merge PDF online India",
    "compress PDF under 100kb SSC",
    "Aadhar card photo size converter",
    "PAN card resize 50kb",
    "passport photo maker online India",
    "handwriting to text Hindi OCR",
    "merge bank statements PDF safely",
    "self attestation PDF online",
    "background remover free",
    "image compressor browser",
    "QR code generator UPI",
    "PDF to image India",
  ];
  return [...toolPhrases, SITE_NAME, "free online tools", "browser PDF tools"].join(", ");
}
