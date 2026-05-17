import type { SeoLandingPage } from "@/lib/seo/landing-pages";
import { SEO_LANDING_PAGES, getLandingPage } from "@/lib/seo/landing-pages";

/** Additional programmatic SEO pages (merged with core landing pages). */
export const PROGRAMMATIC_SEO_PAGES: SeoLandingPage[] = [
  {
    slug: "resize-photo-for-ssc",
    metaTitle: "Resize Photo for SSC Online — CHSL, CGL, MTS | Clawdage",
    metaDescription:
      "Resize SSC exam photos and signatures to notification pixel and KB limits. Browser-based, built for India.",
    keywords: ["resize photo for ssc", "ssc photo size", "ssc signature resize"],
    headline: "Resize Photo for SSC",
    subheadline: "Staff Selection Commission forms need exact photo and signature dimensions — resize without a cyber café.",
    toolSlug: "id-resizer",
    toolCtaLabel: "Resize for SSC",
    sections: [
      {
        heading: "SSC photo requirements change each cycle",
        body: "Download the active notification PDF and match width, height, and KB before you pay fees. Clawdage helps you compress after crop.",
      },
    ],
    faqs: [
      {
        question: "What KB limit does SSC use?",
        answer: "It varies by post and year — never rely on old screenshots; read the current PDF.",
      },
    ],
    relatedToolSlugs: ["passport-photo", "image-compressor", "compress-pdf"],
    relatedLandingSlugs: ["ssc-photo-resizer", "image-resize-for-exam-forms"],
  },
  {
    slug: "resize-photo-for-upsc",
    metaTitle: "Resize Photo for UPSC — CSE Photo & Signature | Clawdage",
    metaDescription:
      "UPSC online application photo and signature resize. Private browser workflow for civil services candidates.",
    keywords: ["resize photo for upsc", "upsc photo size", "upsc signature"],
    headline: "Resize Photo for UPSC",
    subheadline: "Civil services and CAPF forms need tight signature boxes and clear passport-style photos.",
    toolSlug: "id-resizer",
    toolCtaLabel: "Resize for UPSC",
    sections: [
      {
        heading: "UPSC signature scans",
        body: "Sign on white paper, photograph flat, crop tightly, then resize to the pixel box in the instruction booklet.",
      },
    ],
    faqs: [
      {
        question: "Can I use typed signature?",
        answer: "Usually handwritten scan only — confirm in the active year notification.",
      },
    ],
    relatedToolSlugs: ["passport-photo", "e-sign", "compress-pdf"],
    relatedLandingSlugs: ["upsc-signature-resizer"],
  },
  {
    slug: "resize-photo-for-neet",
    metaTitle: "Resize Photo for NEET — NTA Upload Size | Clawdage",
    metaDescription:
      "Resize NEET UG photos for NTA portals. Compress and crop in your browser.",
    keywords: ["resize photo for neet", "neet photo size", "nta photo"],
    headline: "Resize Photo for NEET",
    subheadline: "Match NTA NEET information bulletin specs before final submit.",
    toolSlug: "passport-photo",
    toolCtaLabel: "Resize NEET Photo",
    sections: [
      {
        heading: "Background and dimensions",
        body: "NEET bulletins specify background colour and face coverage — compare your export to the official sample image.",
      },
    ],
    faqs: [
      {
        question: "Does NEET accept mobile photos?",
        answer: "If quality and specs match the bulletin, yes — use even lighting and no filters.",
      },
    ],
    relatedToolSlugs: ["id-resizer", "image-compressor", "bg-remover"],
    relatedLandingSlugs: ["neet-photo-resizer"],
  },
  {
    slug: "resize-photo-for-railway-exam",
    metaTitle: "Resize Photo for Railway Exam — RRB Online Forms | Clawdage",
    metaDescription:
      "Railway recruitment photo resize and compress for RRB online applications in India.",
    keywords: ["railway exam photo resize", "rrb photo size"],
    headline: "Resize Photo for Railway Exam",
    subheadline: "RRB and railway recruitment boards publish photo rules in each notification — match them before upload.",
    toolSlug: "id-resizer",
    toolCtaLabel: "Resize Railway Exam Photo",
    sections: [
      {
        heading: "Avoid rejection",
        body: "Use plain background, neutral expression, and export under the KB cap listed in the active recruitment notice.",
      },
    ],
    faqs: [
      {
        question: "Same tool as SSC?",
        answer: "Yes — ID Resizer with custom dimensions; always verify the railway notification PDF.",
      },
    ],
    relatedToolSlugs: ["passport-photo", "compress-pdf"],
    relatedLandingSlugs: ["ssc-photo-resizer"],
  },
  {
    slug: "online-signature-resizer",
    metaTitle: "Online Signature Resizer — SSC, UPSC, Banking | Clawdage",
    metaDescription:
      "Crop and resize signature scans for Indian online forms. Browser-based and privacy-focused.",
    keywords: ["online signature resizer", "signature size for ssc", "signature crop"],
    headline: "Online Signature Resizer",
    subheadline: "Turn a phone photo of your signature into a portal-ready PNG or JPG under KB limits.",
    toolSlug: "id-resizer",
    toolCtaLabel: "Resize Signature",
    sections: [
      {
        heading: "Signature best practices",
        body: "Blue or black pen on white paper, no shadows, tight crop, then resize to the form's pixel box.",
      },
    ],
    faqs: [
      {
        question: "Transparent background?",
        answer: "Most portals want white background JPG — check the form instructions.",
      },
    ],
    relatedToolSlugs: ["e-sign", "image-compressor"],
    relatedLandingSlugs: ["upsc-signature-resizer", "ssc-photo-resizer"],
  },
  {
    slug: "pan-card-image-resizer",
    metaTitle: "PAN Card Image Resizer Online — NSDL & UTIITSL | Clawdage",
    metaDescription:
      "Resize PAN card applicant photos for income tax and NSDL portals. Under 50 KB workflows.",
    keywords: ["pan card image resizer", "pan photo 50kb"],
    headline: "PAN Card Image Resizer",
    subheadline: "New PAN and update flows often cap photo size aggressively — resize locally before upload.",
    toolSlug: "id-resizer",
    toolCtaLabel: "Resize PAN Photo",
    sections: [
      {
        heading: "PAN photo tips",
        body: "Plain background, face forward, no glasses glare. Compress after setting exact dimensions from the portal help text.",
      },
    ],
    faqs: [
      {
        question: "Same as Aadhaar resize?",
        answer: "Similar workflow — KB and pixels may differ; read the active PAN portal instructions.",
      },
    ],
    relatedToolSlugs: ["passport-photo", "image-compressor"],
    relatedLandingSlugs: ["pan-card-photo-resizer", "aadhaar-photo-resize-online"],
  },
];

export function getAllSeoPageSlugs(): string[] {
  const slugs = new Set<string>();
  for (const p of SEO_LANDING_PAGES) slugs.add(p.slug);
  for (const p of PROGRAMMATIC_SEO_PAGES) slugs.add(p.slug);
  return [...slugs];
}

export function getSeoPageBySlug(slug: string): SeoLandingPage | undefined {
  return getLandingPage(slug) ?? PROGRAMMATIC_SEO_PAGES.find((p) => p.slug === slug);
}
