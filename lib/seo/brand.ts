/** Public site name for titles, Open Graph, and JSON-LD. */
export const SITE_NAME = "Clawdage";

export const SITE_TAGLINE =
  "India's daily digital utility platform — Aadhaar & exam photos, PDF tools, and browser-first privacy from ₹19.";

/** Default when a page does not override `description`. */
export const DEFAULT_DESCRIPTION = `${SITE_NAME}: India's daily digital utility platform. Resize Aadhaar photos, passport photos, compress PDFs for government portals, e-sign, OCR, and more — in your browser. Optional Daily Pass ₹19, no auto-debit.`;

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
    "remove PDF password online",
    "PDF split online India",
    "GST invoice generator PDF",
    "bank statement to Excel",
    "WhatsApp click to chat link",
    "digital signature PNG transparent",
  ];
  return [...toolPhrases, SITE_NAME, "free online tools", "browser PDF tools"].join(", ");
}
