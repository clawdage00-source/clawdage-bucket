/** Tesseract.js traineddata language codes (CDN). */
export type OcrLangOption = { code: string; label: string };

export const OCR_LANGUAGE_OPTIONS: OcrLangOption[] = [
  { code: "eng", label: "English" },
  { code: "hin", label: "Hindi (हिन्दी)" },
  { code: "ben", label: "Bengali" },
  { code: "guj", label: "Gujarati" },
  { code: "kan", label: "Kannada" },
  { code: "mal", label: "Malayalam" },
  { code: "mar", label: "Marathi" },
  { code: "nep", label: "Nepali" },
  { code: "ori", label: "Odia" },
  { code: "pan", label: "Punjabi" },
  { code: "san", label: "Sanskrit" },
  { code: "tam", label: "Tamil" },
  { code: "tel", label: "Telugu" },
  { code: "urd", label: "Urdu" },
  { code: "spa", label: "Spanish" },
  { code: "fra", label: "French" },
  { code: "deu", label: "German" },
];

export function ocrLangLabel(code: string): string {
  return OCR_LANGUAGE_OPTIONS.find((o) => o.code === code)?.label ?? code;
}
