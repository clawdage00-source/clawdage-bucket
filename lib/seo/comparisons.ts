export type ComparisonPage = {
  slug: string;
  title: string;
  metaDescription: string;
  intro: string;
  left: { label: string; points: string[] };
  right: { label: string; points: string[] };
  verdict: string;
  toolLinks: { label: string; href: string }[];
};

export const COMPARISON_PAGES: ComparisonPage[] = [
  {
    slug: "jpg-vs-png",
    title: "JPG vs PNG for Indian Government Portals",
    metaDescription:
      "When to use JPG or PNG for SSC, UPSC, and Aadhaar uploads. Size, quality, and portal rules explained.",
    intro: "Indian portals often specify JPG for photos and PNG for signatures — choosing wrong format causes instant rejection.",
    left: {
      label: "JPG / JPEG",
      points: ["Smaller file size for photos", "Lossy — text can blur if over-compressed", "No transparency"],
    },
    right: {
      label: "PNG",
      points: ["Lossless for sharp text and signatures", "Larger files — may need extra compression", "Supports transparency"],
    },
    verdict: "Use JPG for passport-style photos under KB caps; use PNG when the portal asks for lossless signatures.",
    toolLinks: [
      { label: "Format converter", href: "/tools/format-converter" },
      { label: "Image compressor", href: "/tools/image-compressor" },
    ],
  },
  {
    slug: "merge-pdf-vs-compress-pdf",
    title: "Merge PDF vs Compress PDF — Which Do You Need?",
    metaDescription:
      "Combine multiple PDFs or shrink one file for government portals. Clawdage guide for India.",
    intro: "Students often need both: merge annexures first, then compress the final upload.",
    left: {
      label: "Merge PDF",
      points: ["Combine multiple files into one", "Total size = sum of parts", "Best for annexure order"],
    },
    right: {
      label: "Compress PDF",
      points: ["Reduce KB of a single PDF", "May affect scan quality", "Best for strict portal caps"],
    },
    verdict: "Merge when you have many files; compress when one PDF exceeds the portal KB limit.",
    toolLinks: [
      { label: "Merge PDF", href: "/tools/merge-pdf" },
      { label: "Compress PDF", href: "/tools/compress-pdf" },
    ],
  },
  {
    slug: "ocr-vs-manual-typing",
    title: "OCR vs Manual Typing for Indian Forms",
    metaDescription:
      "Handwriting to text OCR vs typing — accuracy, privacy, and when to use Clawdage OCR.",
    intro: "OCR saves time on notes and forms but always proofread before submitting government applications.",
    left: {
      label: "OCR",
      points: ["Fast for long notes", "Hindi + English on supported models", "Needs clear photos"],
    },
    right: {
      label: "Manual typing",
      points: ["100% accurate if you type carefully", "Slow for long content", "No privacy concerns from AI"],
    },
    verdict: "Use OCR for drafts; verify every field before official submission.",
    toolLinks: [{ label: "OCR tool", href: "/tools/ocr" }],
  },
  {
    slug: "webp-vs-jpg",
    title: "WebP vs JPG — Which to Export for Portals?",
    metaDescription: "WebP vs JPG for uploads in India. Compatibility and compression compared.",
    intro: "Many portals still require JPG — WebP is great for web but not always accepted on legacy government sites.",
    left: { label: "WebP", points: ["Smaller at same quality", "Not accepted on all portals", "Great for modern apps"] },
    right: { label: "JPG", points: ["Universal portal acceptance", "Predictable for exam photos", "Lossy compression"] },
    verdict: "Export JPG for government uploads unless the portal explicitly allows WebP.",
    toolLinks: [{ label: "Format converter", href: "/tools/format-converter" }],
  },
];

export function getComparisonPage(slug: string) {
  return COMPARISON_PAGES.find((p) => p.slug === slug);
}
