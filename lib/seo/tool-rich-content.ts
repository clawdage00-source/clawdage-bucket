import type { ToolSeoEntry } from "@/lib/seo/tool-registry";
import { getToolSeoEntry, TOOL_SEO_BY_SLUG } from "@/lib/seo/tool-registry";
import { getToolBySlug } from "@/lib/tools-data";

export type ExamUseCase = { exam: string; detail: string };

export type ToolExample = {
  title: string;
  beforeLabel: string;
  afterLabel: string;
  beforeValue: string;
  afterValue: string;
  note: string;
};

export type ToolRichContent = ToolSeoEntry & {
  heroSubheadline: string;
  useCases: string[];
  benefits: string[];
  supportedFormats: string[];
  examUseCases: ExamUseCase[];
  example: ToolExample;
  mobileTutorial: string[];
};

const DEFAULT_FORMATS: Record<string, string[]> = {
  pdf: ["PDF"],
  image: ["JPG", "JPEG", "PNG", "WebP"],
  ai: ["JPG", "PNG", "WebP"],
  utility: ["CSV", "XLSX", "XLS"],
  indian: ["JPG", "PNG", "PDF"],
};

function defaultRich(slug: string): ToolRichContent | null {
  const tool = getToolBySlug(slug);
  const seo = getToolSeoEntry(slug);
  if (!tool || !seo) return null;

  return {
    ...seo,
    heroSubheadline: tool.description,
    useCases: [
      `Finish ${tool.name.toLowerCase()} tasks before government or exam portal deadlines.`,
      "Work from a phone at a cyber café or home — no software install.",
      "Keep sensitive scans private with browser-first processing where supported.",
    ],
    benefits: [
      "Built for Indian portal KB and pixel limits",
      "No forced monthly subscription — optional ₹19 Daily Pass",
      "Mobile-friendly upload and download flow",
      "Clear privacy messaging before you process files",
    ],
    supportedFormats: DEFAULT_FORMATS[tool.category] ?? ["JPG", "PNG", "PDF"],
    examUseCases: [
      { exam: "SSC / CHSL / CGL", detail: "Resize photos and compress PDFs to notification limits." },
      { exam: "UPSC / State PSC", detail: "Signature, photo, and annexure PDF workflows." },
      { exam: "NEET / JEE", detail: "NTA-style photo dimensions and file size caps." },
    ],
    example: {
      title: `Typical ${tool.name} result`,
      beforeLabel: "Before",
      afterLabel: "After",
      beforeValue: "2.1 MB · 2400×3200 px",
      afterValue: "48 KB · 140×180 px",
      note: "Exact output depends on your source file and portal rules — always verify in the portal preview.",
    },
    mobileTutorial: [
      "Open clawdage.com in Chrome or Safari on your phone.",
      "Tap upload and pick from gallery or camera.",
      "Apply preset (SSC / UPSC / custom KB) if shown.",
      "Download and check preview before paying application fees.",
    ],
  };
}

const OVERRIDES: Partial<Record<string, Partial<ToolRichContent>>> = {
  "id-resizer": {
    heroSubheadline: "Resize Aadhaar, PAN, and exam photos to exact portal KB and pixel limits — in your browser.",
    example: {
      title: "Resize SSC photo from 2MB to 50KB instantly",
      beforeLabel: "Original upload",
      afterLabel: "Portal-ready",
      beforeValue: "2.0 MB · 1200×1600 px",
      afterValue: "49 KB · 140×180 px",
      note: "Matches typical SSC photo boxes — confirm dimensions in the active notification PDF.",
    },
    examUseCases: [
      { exam: "Aadhaar / PAN KYC", detail: "Under 50–200 KB with readable text." },
      { exam: "SSC / MTS / CHSL", detail: "Photo and signature pixel boxes." },
      { exam: "Banking portals", detail: "Scanned ID proofs within upload caps." },
    ],
  },
  "passport-photo": {
    heroSubheadline: "India passport-size photos (35×45 mm style) with print sheets — PSK, visa, and exam forms.",
    example: {
      title: "Passport photo sheet for print shop",
      beforeLabel: "Phone selfie",
      afterLabel: "4×6 print sheet",
      beforeValue: "3.2 MB casual photo",
      afterValue: "300 DPI · 8 poses per sheet",
      note: "Export PDF or JPEG for retail print — verify country-specific rules for visas.",
    },
  },
  "compress-pdf": {
    heroSubheadline: "Compress PDFs for government portals under 100 KB / 200 KB / 1 MB limits.",
    example: {
      title: "Compress marksheet PDF for portal upload",
      beforeLabel: "Scanned PDF",
      afterLabel: "Compressed",
      beforeValue: "4.8 MB · 600 DPI scan",
      afterValue: "92 KB · readable text",
      note: "If text blurs, reduce DPI at scan time instead of extreme compression.",
    },
  },
  "image-compressor": {
    example: {
      title: "Shrink JPEG for form attachment",
      beforeLabel: "Phone photo",
      afterLabel: "Compressed",
      beforeValue: "3.5 MB JPEG",
      afterValue: "85 KB JPEG",
      note: "Zoom in on small text after compression before final submit.",
    },
  },
  "e-sign": {
    heroSubheadline: "Self-attest PDFs with signature and date — for college, rent, and government copies.",
  },
};

export function getToolRichContent(slug: string): ToolRichContent | null {
  const base = defaultRich(slug);
  if (!base) return null;
  const override = OVERRIDES[slug];
  if (!override) return base;
  return { ...base, ...override, example: { ...base.example, ...override.example } };
}

export function getAllToolRichSlugs(): string[] {
  return Object.keys(TOOL_SEO_BY_SLUG);
}
