import { getRelatedBlogSlugsForTool, type BlogPostMeta } from "@/lib/blog/posts";
import { getToolBySlug, MVP_TOOLS, type ToolDefinition } from "@/lib/tools-data";

/** Curated related tools per slug — drives internal linking on tool & landing pages. */
const RELATED_BY_SLUG: Record<string, string[]> = {
  "passport-photo": ["id-resizer", "image-compressor", "image-to-pdf", "bg-remover"],
  "id-resizer": ["passport-photo", "image-compressor", "e-sign", "format-converter"],
  "image-compressor": ["id-resizer", "passport-photo", "format-converter", "image-to-pdf"],
  "image-to-pdf": ["compress-pdf", "merge-pdf", "e-sign", "format-converter"],
  "format-converter": ["image-compressor", "id-resizer", "bg-remover", "image-to-pdf"],
  "bg-remover": ["passport-photo", "image-compressor", "format-converter", "id-resizer"],
  "e-sign": ["image-to-pdf", "merge-pdf", "compress-pdf", "id-resizer"],
  "ocr": ["pdf-to-excel", "excel-editor", "image-to-pdf", "compress-pdf"],
  "pdf-to-excel": ["excel-editor", "ocr", "compress-pdf", "merge-pdf"],
  "excel-editor": ["pdf-to-excel", "ocr", "image-to-pdf"],
  "qr-generator": ["image-compressor", "format-converter", "image-to-pdf"],
  "merge-pdf": ["compress-pdf", "image-to-pdf", "e-sign"],
  "compress-pdf": ["merge-pdf", "image-to-pdf", "e-sign"],
};

export function getRelatedTools(slug: string, limit = 4): ToolDefinition[] {
  const curated = RELATED_BY_SLUG[slug];
  if (curated?.length) {
    return curated
      .map((s) => getToolBySlug(s))
      .filter((t): t is ToolDefinition => Boolean(t))
      .slice(0, limit);
  }
  const tool = getToolBySlug(slug);
  if (!tool) {
    return MVP_TOOLS.slice(0, limit);
  }
  return MVP_TOOLS.filter((t) => t.slug !== slug && t.category === tool.category).slice(0, limit);
}

export function getRelatedBlogsForTool(slug: string): BlogPostMeta[] {
  return getRelatedBlogSlugsForTool(slug);
}

export function getExamUtilityLinks(): { label: string; href: string }[] {
  return [
    { label: "Aadhaar photo resize", href: "/aadhaar-photo-resize-online" },
    { label: "PAN card photo resizer", href: "/pan-card-photo-resizer" },
    { label: "Passport photo maker India", href: "/passport-photo-maker-india" },
    { label: "SSC photo resizer", href: "/ssc-photo-resizer" },
    { label: "UPSC signature resizer", href: "/upsc-signature-resizer" },
    { label: "NEET photo resizer", href: "/neet-photo-resizer" },
    { label: "PDF compressor for govt portals", href: "/pdf-compressor-for-government-portal" },
    { label: "Self attestation online", href: "/online-self-attestation-tool" },
    { label: "JPG to PDF India", href: "/jpg-to-pdf-india" },
    { label: "Exam form image resize", href: "/image-resize-for-exam-forms" },
  ];
}
