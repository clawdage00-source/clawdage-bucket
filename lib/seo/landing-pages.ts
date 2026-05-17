export type LandingFaq = { question: string; answer: string };

export type SeoLandingPage = {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  headline: string;
  subheadline: string;
  toolSlug: string;
  toolCtaLabel: string;
  sections: { heading: string; body: string }[];
  faqs: LandingFaq[];
  relatedToolSlugs: string[];
  relatedLandingSlugs: string[];
};

export const SEO_LANDING_PAGES: SeoLandingPage[] = [
  {
    slug: "aadhaar-photo-resize-online",
    metaTitle: "Aadhaar Photo Resize Online — Free Browser Tool | Clawdage",
    metaDescription:
      "Resize Aadhaar card photos to government portal KB and pixel limits. 100% browser processing — no file uploads to servers.",
    keywords: ["aadhaar photo resize", "aadhaar card image size", "aadhaar upload kb limit"],
    headline: "Aadhaar Photo Resize Online",
    subheadline:
      "Match Indian government portal dimensions and file size limits — resize and compress in your browser without uploading to strangers.",
    toolSlug: "id-resizer",
    toolCtaLabel: "Resize Aadhaar Photo Now",
    sections: [
      {
        heading: "Why Aadhaar uploads fail",
        body: "Portals reject oversized JPG files or wrong aspect ratios. WhatsApp forwards add compression — always start from a clear scan or photo.",
      },
      {
        heading: "How Clawdage helps",
        body: "Use ID & Photo Resizer with Indian presets, then compress to your target KB. Processing stays on your device for supported workflows.",
      },
    ],
    faqs: [
      {
        question: "What is the Aadhaar photo size for government forms?",
        answer: "Each portal lists its own pixels and KB — read the form PDF. Clawdage lets you enter custom width, height, and export quality.",
      },
      {
        question: "Do you store my Aadhaar image?",
        answer: "No server storage for browser-local tools. Your file stays on your device during editing.",
      },
    ],
    relatedToolSlugs: ["image-compressor", "passport-photo", "format-converter"],
    relatedLandingSlugs: ["pan-card-photo-resizer", "image-resize-for-exam-forms"],
  },
  {
    slug: "pan-card-photo-resizer",
    metaTitle: "PAN Card Photo Resizer Online — 50KB & Portal Sizes | Clawdage",
    metaDescription:
      "Resize PAN card photos for NSDL, UTIITSL, and income tax portals. Browser-based, privacy-first resizing for India.",
    keywords: ["pan card photo resize", "pan card image 50kb", "pan photo online"],
    headline: "PAN Card Photo Resizer",
    subheadline: "Hit PAN portal KB caps and dimensions without Photoshop or cyber café software installs.",
    toolSlug: "id-resizer",
    toolCtaLabel: "Resize PAN Photo",
    sections: [
      {
        heading: "PAN photo specifications",
        body: "New PAN applications often need small JPG files — commonly under 50 KB with fixed pixel dimensions. Check the active portal before export.",
      },
    ],
    faqs: [
      {
        question: "Can I resize PAN photo on mobile?",
        answer: "Yes — Clawdage works in mobile browsers with thumb-friendly controls.",
      },
    ],
    relatedToolSlugs: ["image-compressor", "passport-photo"],
    relatedLandingSlugs: ["aadhaar-photo-resize-online"],
  },
  {
    slug: "passport-photo-maker-india",
    metaTitle: "Passport Photo Maker India — 35×45mm Online | Clawdage",
    metaDescription:
      "Create India-compliant passport photos for PSK, visas, and exams. Crop, background, and export in your browser.",
    keywords: ["passport photo maker india", "passport size photo online", "35x45 passport photo"],
    headline: "Passport Photo Maker India",
    subheadline: "35×45mm style crops, light backgrounds, and exam-friendly exports — no studio required.",
    toolSlug: "passport-photo",
    toolCtaLabel: "Make Passport Photo",
    sections: [
      {
        heading: "Indian passport photo standards",
        body: "Standard passport photos are 35mm × 45mm with plain background. Exam forms may differ — always verify the notification PDF.",
      },
    ],
    faqs: [
      {
        question: "Is this valid for Passport Seva Kendra?",
        answer: "Use as a starting point — PSK may have strict live capture rules. Check official Passport Seva guidance.",
      },
    ],
    relatedToolSlugs: ["bg-remover", "id-resizer", "image-compressor"],
    relatedLandingSlugs: ["ssc-photo-resizer", "neet-photo-resizer"],
  },
  {
    slug: "ssc-photo-resizer",
    metaTitle: "SSC Photo Resizer — CHSL, CGL Image Size Online | Clawdage",
    metaDescription:
      "Resize SSC exam photos and signatures to Staff Selection Commission portal limits. Free browser tool for India.",
    keywords: ["ssc photo resize", "ssc photo size", "ssc signature size"],
    headline: "SSC Photo Resizer",
    subheadline: "Resize SSC photos and signatures for CHSL, CGL, MTS, and other SSC online forms.",
    toolSlug: "id-resizer",
    toolCtaLabel: "Resize for SSC",
    sections: [
      {
        heading: "SSC upload tips",
        body: "Use a plain background, neutral expression, and export to the exact pixel box listed in the notification. Compress after crop if KB is high.",
      },
    ],
    faqs: [
      {
        question: "What size is SSC photo?",
        answer: "It changes per notification — open the official SSC PDF for width, height, and KB.",
      },
    ],
    relatedToolSlugs: ["passport-photo", "image-compressor", "e-sign"],
    relatedLandingSlugs: ["upsc-signature-resizer", "neet-photo-resizer"],
  },
  {
    slug: "upsc-signature-resizer",
    metaTitle: "UPSC Signature Resizer Online — Civil Services Forms | Clawdage",
    metaDescription:
      "Resize UPSC signature scans for CSE, CAPF, and other UPSC online applications. Browser-based and private.",
    keywords: ["upsc signature resize", "upsc signature size", "upsc form signature"],
    headline: "UPSC Signature Resizer",
    subheadline: "Crop and compress handwritten signature scans for UPSC online application portals.",
    toolSlug: "id-resizer",
    toolCtaLabel: "Resize UPSC Signature",
    sections: [
      {
        heading: "Signature scan best practices",
        body: "Sign on white paper with blue/black pen. Photograph flat in daylight, crop tight, then resize to the pixel box in the UPSC instruction PDF.",
      },
    ],
    faqs: [
      {
        question: "Typed signature allowed for UPSC?",
        answer: "Usually handwritten scan only — confirm in the active year notification.",
      },
    ],
    relatedToolSlugs: ["e-sign", "image-compressor"],
    relatedLandingSlugs: ["ssc-photo-resizer"],
  },
  {
    slug: "neet-photo-resizer",
    metaTitle: "NEET Photo Resizer — NTA Upload Size Online | Clawdage",
    metaDescription:
      "Resize NEET UG photos to NTA specifications. Compress and crop in browser for Indian medical entrance applicants.",
    keywords: ["neet photo size", "neet photo resize", "nta neet photo upload"],
    headline: "NEET Photo Resizer",
    subheadline: "Prepare NEET application photos with correct dimensions and KB for NTA portals.",
    toolSlug: "passport-photo",
    toolCtaLabel: "Resize NEET Photo",
    sections: [
      {
        heading: "NEET photo checklist",
        body: "Match background colour, face coverage, and file size from the current NTA information bulletin — not outdated blog screenshots.",
      },
    ],
    faqs: [
      {
        question: "Can I edit NEET photo background?",
        answer: "Use Passport Photo Maker or Background Remover if the bulletin allows plain backgrounds.",
      },
    ],
    relatedToolSlugs: ["id-resizer", "image-compressor", "bg-remover"],
    relatedLandingSlugs: ["ssc-photo-resizer"],
  },
  {
    slug: "pdf-compressor-for-government-portal",
    metaTitle: "PDF Compressor for Government Portal — Under 100KB | Clawdage",
    metaDescription:
      "Compress PDF files for SSC, UPSC, and state government uploads. Shrink size for portal KB limits in your browser.",
    keywords: ["pdf compressor government portal", "compress pdf 100kb", "ssc pdf size"],
    headline: "PDF Compressor for Government Portals",
    subheadline: "Shrink PDFs to SSC, UPSC, and state portal KB limits without emailing files to random websites.",
    toolSlug: "compress-pdf",
    toolCtaLabel: "Compress PDF Now",
    sections: [
      {
        heading: "When PDFs are rejected",
        body: "High-DPI scans blow past 100 KB caps. Merge only what you need, compress, and re-check preview before paying application fees.",
      },
    ],
    faqs: [
      {
        question: "Will compression make text unreadable?",
        answer: "Text PDFs compress well; scanned pages need moderate DPI — avoid extreme settings.",
      },
    ],
    relatedToolSlugs: ["merge-pdf", "image-to-pdf", "e-sign"],
    relatedLandingSlugs: ["jpg-to-pdf-india"],
  },
  {
    slug: "online-self-attestation-tool",
    metaTitle: "Online Self Attestation Tool — Sign PDF in Browser | Clawdage",
    metaDescription:
      "Self-attest PDF documents online. Draw signature, add date, and stamp pages — 100% in your browser for India.",
    keywords: ["self attestation online", "self attest pdf", "e sign pdf india"],
    headline: "Online Self Attestation Tool",
    subheadline: "Draw or type your signature, add dates, and stamp PDFs for college, rent, and government submissions.",
    toolSlug: "e-sign",
    toolCtaLabel: "Self-Attest PDF",
    sections: [
      {
        heading: "What is self attestation?",
        body: "You sign a photocopy or PDF copy to certify it matches the original. Clawdage E-Sign runs locally so sensitive affidavits stay private.",
      },
    ],
    faqs: [
      {
        question: "Is digital self attestation accepted everywhere?",
        answer: "Acceptance varies by institution — check if they need wet ink, scanned sign, or digital stamp.",
      },
    ],
    relatedToolSlugs: ["image-to-pdf", "merge-pdf", "compress-pdf"],
    relatedLandingSlugs: ["pdf-compressor-for-government-portal"],
  },
  {
    slug: "jpg-to-pdf-india",
    metaTitle: "JPG to PDF India — Merge Images to PDF Online | Clawdage",
    metaDescription:
      "Convert JPG and PNG to PDF for Indian applications. Merge photos, Aadhaar scans, and marksheets in your browser.",
    keywords: ["jpg to pdf india", "image to pdf online", "photo to pdf merge"],
    headline: "JPG to PDF — Built for India",
    subheadline: "Turn phone photos and scans into a single PDF for uploads, email, and print — no install required.",
    toolSlug: "image-to-pdf",
    toolCtaLabel: "Convert to PDF",
    sections: [
      {
        heading: "Common use cases",
        body: "Combine marksheet photos, ID proofs, and signed pages into one PDF under portal size limits — then compress if needed.",
      },
    ],
    faqs: [
      {
        question: "Is there a page limit?",
        answer: "Practical limits depend on your device memory — start with fewer pages for older phones.",
      },
    ],
    relatedToolSlugs: ["compress-pdf", "merge-pdf", "e-sign"],
    relatedLandingSlugs: ["pdf-compressor-for-government-portal"],
  },
  {
    slug: "image-resize-for-exam-forms",
    metaTitle: "Image Resize for Exam Forms — SSC, NEET, State | Clawdage",
    metaDescription:
      "Resize images for Indian exam application forms. Pixel-perfect crops and KB compression in your browser.",
    keywords: ["exam form photo resize", "resize image for ssc", "government form photo size"],
    headline: "Image Resize for Exam Forms",
    subheadline: "One workflow for SSC, NEET, state PSC, and university forms — crop, compress, download.",
    toolSlug: "id-resizer",
    toolCtaLabel: "Resize Exam Photo",
    sections: [
      {
        heading: "Exam form workflow",
        body: "Read the notification PDF → set exact pixels in ID Resizer → compress to KB → upload and verify preview before payment.",
      },
    ],
    faqs: [
      {
        question: "Which tool for photo vs signature?",
        answer: "ID Resizer for both — use tight crop for signatures and head-and-shoulders crop for photos.",
      },
    ],
    relatedToolSlugs: ["passport-photo", "image-compressor", "format-converter"],
    relatedLandingSlugs: ["ssc-photo-resizer", "neet-photo-resizer", "aadhaar-photo-resize-online"],
  },
];

export function getLandingPage(slug: string): SeoLandingPage | undefined {
  return SEO_LANDING_PAGES.find((p) => p.slug === slug);
}

export function getAllLandingSlugs(): string[] {
  return SEO_LANDING_PAGES.map((p) => p.slug);
}
