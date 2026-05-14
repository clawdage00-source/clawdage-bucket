/** Filter tabs shown above the grid (Indian = exam-portal / ID tooling). */
export const TOOL_TAB_IDS = ["all", "pdf", "image", "ai", "utility", "indian"] as const;

export type ToolTabId = (typeof TOOL_TAB_IDS)[number];

export type ToolCategory = Exclude<ToolTabId, "all">;

export type ToolIconId =
  | "layers"
  | "file-archive"
  | "file-image"
  | "file-signature"
  | "wand-sparkles"
  | "image-down"
  | "refresh-cw"
  | "contact"
  | "id-card"
  | "qr-code"
  | "scan-text";

export type ToolDefinition = {
  slug: string;
  name: string;
  description: string;
  category: ToolCategory;
  is_pro: boolean;
  icon: ToolIconId;
};

export const MVP_TOOLS: ToolDefinition[] = [
  {
    slug: "merge-pdf",
    name: "Merge PDF",
    description: "Combine multiple PDFs into one clean document.",
    category: "pdf",
    is_pro: false,
    icon: "layers",
  },
  {
    slug: "compress-pdf",
    name: "Compress PDF",
    description: "Shrink PDF size for faster uploads to portals.",
    category: "pdf",
    is_pro: false,
    icon: "file-archive",
  },
  {
    slug: "image-to-pdf",
    name: "Image to PDF",
    description: "Turn JPG or PNG pages into a single PDF.",
    category: "pdf",
    is_pro: false,
    icon: "file-image",
  },
  {
    slug: "e-sign",
    name: "Self-Attestation & E-Sign",
    description: "Draw or type your signature, stamp PDFs, and add dates — 100% in your browser.",
    category: "pdf",
    is_pro: false,
    icon: "file-signature",
  },
  {
    slug: "bg-remover",
    name: "AI Background Remover",
    description: "Remove backgrounds in-browser with local AI — transparent PNG export.",
    category: "ai",
    is_pro: false,
    icon: "wand-sparkles",
  },
  {
    slug: "image-compressor",
    name: "Image Compressor",
    description: "Reduce image weight without leaving your browser.",
    category: "image",
    is_pro: false,
    icon: "image-down",
  },
  {
    slug: "format-converter",
    name: "Format Converter",
    description: "Switch between PNG, JPG, WebP, and more.",
    category: "image",
    is_pro: false,
    icon: "refresh-cw",
  },
  {
    slug: "passport-photo",
    name: "Passport Photo Maker",
    description:
      "3.5×4.5cm passport photos: AI background removal, crop, print sheets (4×6 & A4), PDF/JPEG at 300 DPI.",
    category: "indian",
    is_pro: false,
    icon: "contact",
  },
  {
    slug: "id-resizer",
    name: "Aadhar / PAN Card Resizer",
    description: "Resize scans for Indian exam and application portals.",
    category: "indian",
    is_pro: false,
    icon: "id-card",
  },
  {
    slug: "qr-generator",
    name: "QR Code Generator",
    description: "Encode URLs or text into a scannable QR image.",
    category: "utility",
    is_pro: false,
    icon: "qr-code",
  },
  {
    slug: "ocr",
    name: "AI Handwriting OCR",
    description: "Groq Vision: extract text and auto-detect language (pass).",
    category: "ai",
    is_pro: true,
    icon: "scan-text",
  },
];

const TAB_LABELS: Record<ToolTabId, string> = {
  all: "All",
  pdf: "PDF",
  image: "Image",
  ai: "AI",
  utility: "Utility",
  indian: "Indian",
};

export function getTabLabel(tab: ToolTabId): string {
  return TAB_LABELS[tab];
}

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return MVP_TOOLS.find((t) => t.slug === slug);
}

export const MVP_TOOL_SLUGS = MVP_TOOLS.map((t) => t.slug);

export function toolMatchesSearch(tool: ToolDefinition, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const categoryLabel = TAB_LABELS[tool.category].toLowerCase();
  const extras =
    tool.category === "indian"
      ? "indian specials india exam portal aadhar pan passport"
      : "";
  const haystack = [
    tool.name.toLowerCase(),
    tool.description.toLowerCase(),
    tool.slug.replace(/-/g, " "),
    categoryLabel,
    extras,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}
