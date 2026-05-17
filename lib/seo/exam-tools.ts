export type ExamToolEntry = {
  slug: string;
  title: string;
  description: string;
  href: string;
  toolSlug: string;
  badge?: string;
};

/** Exam hub cards — links to SEO landers or live tools */
export const EXAM_TOOLS: ExamToolEntry[] = [
  {
    slug: "ssc-photo",
    title: "SSC Photo Resizer",
    description: "CHSL, CGL, MTS photo & signature sizes for Staff Selection Commission portals.",
    href: "/ssc-photo-resizer",
    toolSlug: "id-resizer",
    badge: "Exam season",
  },
  {
    slug: "upsc-photo",
    title: "UPSC Photo & Signature",
    description: "Civil services application photo and signature pixel boxes.",
    href: "/upsc-signature-resizer",
    toolSlug: "id-resizer",
  },
  {
    slug: "neet-photo",
    title: "NEET Photo Resizer",
    description: "NTA NEET UG photo dimensions and KB limits.",
    href: "/neet-photo-resizer",
    toolSlug: "passport-photo",
  },
  {
    slug: "kerala-psc",
    title: "Kerala PSC Photo Resize",
    description: "State PSC photo specs — resize and compress for Kerala portals.",
    href: "/image-resize-for-exam-forms",
    toolSlug: "id-resizer",
  },
  {
    slug: "signature",
    title: "Signature Resizer",
    description: "Crop handwritten signature scans for online forms.",
    href: "/online-signature-resizer",
    toolSlug: "id-resizer",
  },
  {
    slug: "thumb",
    title: "Thumb Impression Cropper",
    description: "Banking and KYC thumb print box crops (coming soon — use ID resizer meanwhile).",
    href: "/tools/id-resizer",
    toolSlug: "id-resizer",
    badge: "Beta",
  },
  {
    slug: "hall-ticket",
    title: "Hall Ticket Photo Formatter",
    description: "Format passport-style photos for hall ticket uploads.",
    href: "/passport-photo-maker-india",
    toolSlug: "passport-photo",
  },
  {
    slug: "railway",
    title: "Railway Exam Photo",
    description: "RRB and railway recruitment photo resize workflows.",
    href: "/resize-photo-for-railway-exam",
    toolSlug: "id-resizer",
  },
];

export const EXAM_FAQS = [
  {
    question: "Do Clawdage exam tools store my photo?",
    answer:
      "When processing runs in your browser, files are not uploaded to our servers for that workflow. Use a trusted device for Aadhaar and exam photos.",
  },
  {
    question: "Which tool for SSC vs UPSC?",
    answer:
      "Both often use ID & Photo Resizer with different pixel presets — always read the active notification PDF for exact numbers.",
  },
  {
    question: "Is ₹19 Daily Pass enough for one application?",
    answer:
      "Yes — the Daily Pass is designed for one-time government application days without auto-debit subscriptions.",
  },
] as const;
