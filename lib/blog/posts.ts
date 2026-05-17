export type BlogCategory =
  | "Government Exams"
  | "PDF Guides"
  | "Passport Photos"
  | "Aadhaar Utilities"
  | "File Compression"
  | "Student Tools";

export type BlogPostMeta = {
  slug: string;
  title: string;
  description: string;
  category: BlogCategory;
  publishedAt: string;
  readMinutes: number;
  relatedToolSlugs: string[];
  relatedLandingSlugs?: string[];
};

export type BlogPost = BlogPostMeta & {
  sections: { heading?: string; paragraphs: string[] }[];
  faqs: { question: string; answer: string }[];
};

const POSTS: BlogPost[] = [
  {
    slug: "resize-aadhaar-card-images-government-portals",
    title: "How to Resize Aadhaar Card Images for Government Portals",
    description:
      "Step-by-step guide to Aadhaar photo dimensions, KB limits, and browser-based resizing for Indian government uploads.",
    category: "Aadhaar Utilities",
    publishedAt: "2026-05-01",
    readMinutes: 6,
    relatedToolSlugs: ["id-resizer", "image-compressor", "passport-photo"],
    relatedLandingSlugs: ["aadhaar-photo-resize-online"],
    sections: [
      {
        paragraphs: [
          "Most Indian government portals reject Aadhaar uploads that are too large in file size or wrong in pixel dimensions. Cyber cafés and mobile users often get stuck re-exporting photos from WhatsApp — which adds compression artifacts.",
          "Clawdage resizes and compresses locally in your browser so your Aadhaar scan never uploads to a third-party file host.",
        ],
      },
      {
        heading: "Typical Aadhaar upload requirements",
        paragraphs: [
          "Portals commonly ask for JPG or PNG between 20 KB and 200 KB, with square or passport-style crops. Always read the exact line on the form — SSC, UPSC, and state portals differ.",
          "Use the ID & Photo Resizer tool with a preset close to the portal spec, then compress if the KB count is still high.",
        ],
      },
      {
        heading: "Quick workflow",
        paragraphs: [
          "1. Save a clear photo or scan (avoid blurry WhatsApp forwards).",
          "2. Open Clawdage ID Resizer — pick dimension preset or enter width/height.",
          "3. Compress to target KB if needed.",
          "4. Upload to the portal and verify preview before payment.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is it safe to resize Aadhaar online?",
        answer:
          "With Clawdage, resizing happens in your browser for supported tools — files are not stored on our servers. For highly sensitive documents, use a trusted device and close the tab when finished.",
      },
      {
        question: "What size is Aadhaar photo for government forms?",
        answer:
          "There is no single national standard — each portal lists pixels and KB. Check the form PDF or help text before exporting.",
      },
    ],
  },
  {
    slug: "best-passport-photo-size-indian-applications",
    title: "Best Passport Photo Size for Indian Applications",
    description:
      "India passport photo dimensions in pixels and mm, plus how to make compliant photos for PSK, exams, and visas.",
    category: "Passport Photos",
    publishedAt: "2026-05-03",
    readMinutes: 5,
    relatedToolSlugs: ["passport-photo", "id-resizer", "bg-remover"],
    relatedLandingSlugs: ["passport-photo-maker-india"],
    sections: [
      {
        paragraphs: [
          "Indian passport photos are typically 35mm × 45mm (413 × 531 pixels at 300 DPI) with a plain light background and neutral expression.",
          "Exam forms sometimes use smaller sizes — always match the portal screenshot, not a generic template.",
        ],
      },
      {
        heading: "Passport Seva vs exam forms",
        paragraphs: [
          "Passport Seva Kendra appointments need strict framing — head height, ears visible, no glasses glare.",
          "SSC, NEET, and state exams may specify different pixel widths — use Clawdage Passport Photo Maker presets where available.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can I use a phone selfie for passport photo?",
        answer:
          "Only if it meets framing rules — plain wall, even light, no filters. The Passport Photo tool crops to standard ratios.",
      },
    ],
  },
  {
    slug: "compress-pdf-without-losing-quality",
    title: "How to Compress PDFs Without Losing Quality",
    description:
      "Reduce PDF size for government portals while keeping text readable — browser tips for Indian applicants.",
    category: "File Compression",
    publishedAt: "2026-05-05",
    readMinutes: 7,
    relatedToolSlugs: ["compress-pdf", "merge-pdf", "image-to-pdf"],
    relatedLandingSlugs: ["pdf-compressor-for-government-portal"],
    sections: [
      {
        paragraphs: [
          "Government portals often cap PDFs at 100 KB, 200 KB, or 1 MB. Scanning at 600 DPI is the main reason uploads fail.",
          "Compress in stages: lower scan DPI first, then use Clawdage Compress PDF for the final push under the limit.",
        ],
      },
    ],
    faqs: [
      {
        question: "Why did my compressed PDF look blurry?",
        answer:
          "Aggressive compression hurts scanned images more than text PDFs. Start from a 150–200 DPI scan for forms.",
      },
    ],
  },
  {
    slug: "ssc-signature-resize-guide",
    title: "SSC Signature Resize Guide",
    description:
      "Resize SSC signature scans to pixel and KB limits for CHSL, CGL, and other Staff Selection Commission forms.",
    category: "Government Exams",
    publishedAt: "2026-05-08",
    readMinutes: 5,
    relatedToolSlugs: ["id-resizer", "e-sign", "image-compressor"],
    relatedLandingSlugs: ["ssc-photo-resizer", "upsc-signature-resizer"],
    sections: [
      {
        paragraphs: [
          "SSC forms usually need a small signature box — often around 140 × 60 pixels and under 20–50 KB.",
          "Sign on white paper with black/blue pen, photograph in good light, crop tightly, then resize with ID Resizer.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can I use typed signature for SSC?",
        answer:
          "Only if the notification allows it — most require handwritten signature scans. Check the official PDF instructions.",
      },
    ],
  },
  {
    slug: "neet-photo-upload-requirements",
    title: "NEET Photo Upload Requirements",
    description:
      "NEET UG photo size, background, and file size — prepare compliant images without studio visits.",
    category: "Government Exams",
    publishedAt: "2026-05-10",
    readMinutes: 6,
    relatedToolSlugs: ["passport-photo", "id-resizer", "image-compressor"],
    relatedLandingSlugs: ["neet-photo-resizer"],
    sections: [
      {
        paragraphs: [
          "NEET application photos must match NTA specifications each year — background colour, dimensions, and KB cap change slightly.",
          "Before final upload, compare your export against the official NEET information bulletin PDF.",
        ],
      },
    ],
    faqs: [
      {
        question: "What background colour does NEET need?",
        answer:
          "Follow the current year NTA bulletin — often white or light coloured. Do not rely on last year's screenshots alone.",
      },
    ],
  },
];

export function getAllBlogPosts(): BlogPostMeta[] {
  return POSTS.map(({ sections: _s, faqs: _f, ...meta }) => meta);
}

export function getBlogPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}

export function getBlogPostsByCategory(category: BlogCategory): BlogPostMeta[] {
  return getAllBlogPosts().filter((p) => p.category === category);
}

export function getRelatedBlogSlugsForTool(toolSlug: string): BlogPostMeta[] {
  return getAllBlogPosts()
    .filter((p) => p.relatedToolSlugs.includes(toolSlug))
    .slice(0, 3);
}
