export type ToolFaqItem = { question: string; answer: string };

export type ToolSeoEntry = {
  /** Shown in <title> via template (keep concise). */
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  howToSteps: [string, string, string];
  whyTitle: string;
  whyParagraph: string;
  /** H2 + supporting copy with Indian exam / portal angles. */
  targetHeading: string;
  targetBody: string;
  faqs: ToolFaqItem[];
};

export const TOOL_SEO_BY_SLUG: Record<string, ToolSeoEntry> = {
  "merge-pdf": {
    metaTitle: "Merge PDF Online — Fast, Private PDF Joiner for India",
    metaDescription:
      "Combine multiple PDFs into one file in seconds. 100% private browser-side merging for bank statements, SSC forms, and college bundles — no uploads to our servers for merge.",
    keywords: [
      "merge PDF online",
      "merge bank statements PDF safely",
      "combine PDF India",
      "SSC application PDF merge",
    ],
    howToSteps: [
      "Drag and drop your PDFs (or pick files), arrange the order you need.",
      "Click merge — processing runs locally in your browser when supported.",
      "Download a single combined PDF ready for portals or print.",
    ],
    whyTitle: "Why choose Clawdage for merging PDFs?",
    whyParagraph:
      "Many “free” PDF sites upload your files to unknown servers. Clawdage is built privacy-first: merge workflows run on your device so sensitive statements and mark sheets stay with you.",
    targetHeading: "Best for SSC, UPSC, and university document bundles",
    targetBody:
      "Exam portals often ask for one consolidated PDF. Whether you are uploading semester mark sheets, annexures, or multiple annexures for UPSC and SSC forms, merging locally reduces mistakes and keeps filenames under your control. Use clear page order before merging so reviewers see annexure A before annexure B.",
    faqs: [
      {
        question: "Is merging PDFs safe on Clawdage?",
        answer:
          "When processing runs in your browser, your PDF bytes are not sent to our servers for that step. Always review the final file before submitting to government or bank portals.",
      },
      {
        question: "Does it work on mobile?",
        answer:
          "Yes on modern mobile browsers. Large bundles may be slower on older phones — use Wi‑Fi for big merges.",
      },
      {
        question: "Will merged files stay under portal size limits?",
        answer:
          "Merging does not always shrink total size. If you need strict limits (for example under 100 KB), follow up with our PDF compressor tool.",
      },
    ],
  },
  "compress-pdf": {
    metaTitle: "Compress PDF Online — Shrink PDFs for Portals (SSC, Banks, Exams)",
    metaDescription:
      "Reduce PDF file size for faster uploads to Indian exam and bank portals. Private in-browser compression for common workflows — pair with merge when you need one light file.",
    keywords: [
      "compress PDF under 100kb for SSC",
      "PDF compressor India",
      "shrink PDF online",
      "exam portal PDF size",
    ],
    howToSteps: [
      "Upload your PDF and choose a sensible quality or target size preset if available.",
      "Run compression in the browser and preview the result when the tool allows.",
      "Download the smaller PDF and verify the portal’s KB limit before submitting.",
    ],
    whyTitle: "Why compress before you upload?",
    whyParagraph:
      "Oversized PDFs bounce from SSC, banking, and university portals. Compressing locally helps you stay under strict KB caps without emailing files to random cloud converters.",
    targetHeading: "Compress PDF under 100 KB for SSC and similar portals",
    targetBody:
      "Many Indian portals enforce hard size ceilings. Start from the original export (avoid re-scanning phone photos twice). If one pass is not enough, try a second pass at lower quality only if text remains readable. Keep a backup of the original PDF before aggressive compression.",
    faqs: [
      {
        question: "Will compression ruin scanned text?",
        answer:
          "Aggressive compression can affect fine print. Zoom in after compression; if text breaks up, undo and try a lighter setting.",
      },
      {
        question: "Is it safe?",
        answer:
          "Browser-side compression avoids uploading your file to unknown backends when that mode is supported. Check the tool banner for processing location.",
      },
      {
        question: "Does it work on mobile?",
        answer:
          "Yes for supported browsers. Very large PDFs may take longer — keep the tab active until download completes.",
      },
    ],
  },
  "image-to-pdf": {
    metaTitle: "Image to PDF Online — Turn JPG/PNG Pages into One PDF",
    metaDescription:
      "Convert photos and scans into a single PDF for applications and class submissions. Built for quick, private workflows from your desktop or phone browser.",
    keywords: ["image to PDF", "JPG to PDF India", "photos to one PDF", "scanner photos PDF"],
    howToSteps: [
      "Select images in the order you want pages to appear.",
      "Choose page size or margins if the tool offers options.",
      "Generate and download one PDF for upload to your portal.",
    ],
    whyTitle: "Why Clawdage for image to PDF?",
    whyParagraph:
      "Students and job seekers often photograph each page separately. Combining into one ordered PDF looks professional and matches what many Indian forms request.",
    targetHeading: "Great for assignments and form annexures",
    targetBody:
      "If a portal asks for “single PDF annexure”, stacked JPGs are not enough — you need one file. Ordering pages correctly avoids rejection. Prefer well-lit photos over heavy shadows so downstream OCR (if any) stays accurate.",
    faqs: [
      {
        question: "Is it safe?",
        answer:
          "Prefer browser-side conversion when offered so scans of IDs and marksheets stay on your device.",
      },
      {
        question: "Does it work on mobile?",
        answer:
          "Yes — pick photos from your gallery in order and export.",
      },
      {
        question: "Maximum number of images?",
        answer:
          "Limits depend on browser memory. For very long bundles, split into two PDFs then merge.",
      },
    ],
  },
  "e-sign": {
    metaTitle: "Self-Attestation & E-Sign PDF Online — Aadhar, Marksheets, Forms",
    metaDescription:
      "Draw or type your signature and place it on PDFs for self-attestation. Private browser workflow for Indian exam and KYC bundles — ideal before portal upload.",
    keywords: [
      "self attestation PDF online",
      "sign PDF Aadhar copy",
      "e sign PDF India",
      "self attest marksheet PDF",
    ],
    howToSteps: [
      "Open your PDF and create or paste your signature once.",
      "Drag stamps to each required page and add date text if needed.",
      "Export a flattened PDF suitable for portals that reject editable fields.",
    ],
    whyTitle: "Why choose Clawdage for self-attestation?",
    whyParagraph:
      "Self-attestation usually means signing copies yourself before upload. Doing it in-browser avoids sending raw identity documents through opaque chat apps or random editors.",
    targetHeading: "Best for SSC & UPSC document copies",
    targetBody:
      "Many notices ask for self-attested PDFs of ID and certificates. Keep signatures inside the box the form shows, use dark ink-style strokes for clarity, and flatten so reviewers cannot accidentally move stamps. Always read the latest commission instructions for colour vs black-and-white rules.",
    faqs: [
      {
        question: "Is it safe?",
        answer:
          "Processing stays in your browser for supported exports. Do not share signed PDFs in public channels.",
      },
      {
        question: "Does it work on mobile?",
        answer:
          "Yes — use landscape for fine placement. For long PDFs, a desktop may be faster.",
      },
      {
        question: "Will portals accept the exported PDF?",
        answer:
          "Most accept standard PDFs. If a site rejects the file, try re-exporting with compatibility options when available.",
      },
    ],
  },
  "bg-remover": {
    metaTitle: "Free AI Background Remover — Transparent PNG in Your Browser",
    metaDescription:
      "Remove image backgrounds with on-device AI. Export transparent PNGs for composites, listings, and creative work — daily free tier with optional pass for heavy use.",
    keywords: [
      "remove background online free",
      "transparent PNG India",
      "AI background remover browser",
    ],
    howToSteps: [
      "Upload a clear subject photo with good contrast against the background.",
      "Run removal and refine edges if the tool exposes brushes or masks.",
      "Download PNG with alpha for slides, thumbnails, or print layouts.",
    ],
    whyTitle: "Privacy-first background removal",
    whyParagraph:
      "Product photos and portraits should not be uploaded to unknown clouds. Local inference keeps your frames under your control when the tool runs in-browser.",
    targetHeading: "Ideal for sellers and creators",
    targetBody:
      "Marketplaces and pitch decks need clean cut-outs. Start from high-resolution originals, avoid heavy JPEG noise, and export PNG for transparency. For passport-style strict crops, use our dedicated passport photo tool instead of generic removal alone.",
    faqs: [
      {
        question: "Is it safe?",
        answer:
          "When processing is local, images are not sent to our servers for inference. Check the tool notice for the exact mode on your browser.",
      },
      {
        question: "Does it work on mobile?",
        answer:
          "Supported on modern phones; large images may take longer.",
      },
      {
        question: "Hair and glass edges look wrong — why?",
        answer:
          "Fine flyaway hair and reflections are hard for any model. Try softer lighting in the source photo and re-run.",
      },
    ],
  },
  "image-compressor": {
    metaTitle: "Image Compressor Online — Reduce Size Without Leaving Your Browser",
    metaDescription:
      "Shrink JPG, PNG, and WebP images for faster uploads and smaller attachments. Helpful for exam forms and email limits with a privacy-first mindset.",
    keywords: ["compress image online", "reduce photo size KB", "image compressor India"],
    howToSteps: [
      "Pick one or more images from your device.",
      "Choose a quality or max-width preset if available.",
      "Download compressed files and verify clarity on text regions.",
    ],
    whyTitle: "Why compress locally?",
    whyParagraph:
      "Smaller images upload faster on slow campus Wi‑Fi and fit portal limits. Browser-side compression avoids leaking coursework or ID scans to random servers.",
    targetHeading: "Useful for forms that cap attachment size",
    targetBody:
      "If a JPEG export from your phone is still too large, downscale width first for document photos, then compress. Always read small text after compression — if it smears, undo and pick a higher quality.",
    faqs: [
      {
        question: "Is it safe?",
        answer:
          "Local processing avoids third-party image hosting when enabled for this workflow.",
      },
      {
        question: "Does it work on mobile?",
        answer:
          "Yes — pick from gallery and download smaller copies.",
      },
      {
        question: "Bulk compression?",
        answer:
          "Bulk features may require a pass — see pricing for current limits.",
      },
    ],
  },
  "format-converter": {
    metaTitle: "Image Format Converter — PNG, JPG, WebP Online",
    metaDescription:
      "Switch between common web image formats for compatibility with portals and print shops. Lightweight browser workflow for designers and students.",
    keywords: ["PNG to JPG", "WebP converter", "image format converter online India"],
    howToSteps: [
      "Upload your source image.",
      "Pick the target format (for example PNG to JPG).",
      "Download the converted file and verify colour profile if needed for print.",
    ],
    whyTitle: "Why convert formats?",
    whyParagraph:
      "Some Indian portals only accept JPG while your scan saved as PNG. Quick conversion avoids re-scanning fragile paper documents.",
    targetHeading: "Best when portals specify exact types",
    targetBody:
      "Always keep a lossless master (PNG/TIFF) for archival, then export JPG copies under portal rules. Watch for transparency loss when moving from PNG to JPG.",
    faqs: [
      {
        question: "Is it safe?",
        answer:
          "Prefer on-device conversion when offered so ID scans stay private.",
      },
      {
        question: "Does it work on mobile?",
        answer:
          "Yes for supported browsers.",
      },
      {
        question: "Will quality drop?",
        answer:
          "Lossy formats like JPG always trade size for quality — keep originals.",
      },
    ],
  },
  "passport-photo": {
    metaTitle: "Passport Photo Maker Online India — 3.5×4.5 cm, Print Sheets, PDF",
    metaDescription:
      "Create India-friendly passport-size photos with cropping, background cleanup, and print-ready sheets (4×6 & A4). 300 DPI exports for offline submission and online forms.",
    keywords: [
      "passport photo maker online India",
      "3.5x4.5 photo online",
      "passport size photo PDF",
    ],
    howToSteps: [
      "Upload a front-facing photo with even lighting.",
      "Pick the passport preset and adjust crop to ear and chin guidelines shown in-tool.",
      "Export JPEG or PDF sheets for retail print or home printer.",
    ],
    whyTitle: "Why use a dedicated passport photo tool?",
    whyParagraph:
      "Generic editors do not enforce cm sizes or print margins. A purpose-built flow reduces rejections at POPSK, courier franchises, and online visa portals.",
    targetHeading: "India print sizes and sheet layouts",
    targetBody:
      "Different services ask for 3.5×4.5 cm or similar. Always export at 300 DPI when printing. If a portal wants a plain white background, run background removal before placing on the sheet. Keep a neutral expression unless the target country allows a smile.",
    faqs: [
      {
        question: "Is it safe?",
        answer:
          "Photos stay in your browser for supported export paths — avoid public computers for ID photos.",
      },
      {
        question: "Does it work on mobile?",
        answer:
          "Yes — shoot against a plain wall, then crop in-tool.",
      },
      {
        question: "Will the print shop accept the sheet?",
        answer:
          "Most accept 4×6 inch sheets with multiple poses. Confirm matte vs glossy preference locally.",
      },
    ],
  },
  "id-resizer": {
    metaTitle: "Aadhar & PAN Card Resizer Online — Under 50 KB / 100 KB for Portals",
    metaDescription:
      "Resize and compress ID scans for Indian exam and application portals. Built for predictable KB limits with privacy-aware, in-browser processing when supported.",
    keywords: [
      "Aadhar card photo size converter",
      "PAN resize 50kb",
      "Aadhar resize online",
      "id card resizer India",
    ],
    howToSteps: [
      "Upload your Aadhar or PAN scan (front/back as required).",
      "Choose the portal preset (for example 50 KB or 100 KB) if available.",
      "Download and verify readable text before uploading.",
    ],
    whyTitle: "Why a dedicated ID resizer?",
    whyParagraph:
      "Portal validators reject oversize uploads instantly. Resizing with readable compression avoids last-minute cyber-cafe runs before deadlines.",
    targetHeading: "Best for Indian exam and KYC portals",
    targetBody:
      "SSC, state PSC, and banking forms often specify maximum dimensions and file sizes. Start from a straight scan, not a skewed photo of a photo. If text looks soft after compression, undo and try a smaller pixel width before maxing out JPEG compression.",
    faqs: [
      {
        question: "Is it safe?",
        answer:
          "Treat ID images like secrets. Use personal devices, avoid public Wi‑Fi uploads, and delete downloads after submission when possible.",
      },
      {
        question: "Does it work on mobile?",
        answer:
          "Yes — ensure the camera is parallel to the card to reduce blur.",
      },
      {
        question: "Still over the KB limit?",
        answer:
          "Reduce dimensions first, then quality. Some portals also cap pixel width — read their PDF help section.",
      },
    ],
  },
  "qr-generator": {
    metaTitle: "QR Code Generator — UPI, Wi‑Fi, Links, and Text",
    metaDescription:
      "Create scannable QR codes for payments, Wi‑Fi handshakes, and marketing. Export high-resolution images suitable for print posters and shop counters.",
    keywords: ["QR code generator India", "UPI QR maker", "WiFi QR code"],
    howToSteps: [
      "Pick a QR type (URL, text, Wi‑Fi, or payment payload if supported).",
      "Enter the exact string — test scan before printing.",
      "Download PNG/SVG when available and size for your poster or sticker.",
    ],
    whyTitle: "Why generate QR codes locally?",
    whyParagraph:
      "Short-lived campaign links and Wi‑Fi passwords should not pass through opaque third parties. Browser generation keeps payloads on-device until you export.",
    targetHeading: "Retail and campus use",
    targetBody:
      "Shops use UPI QR standees; events share Wi‑Fi without spelling passwords. Use high error-correction for outdoor prints and test with multiple reader apps before mass printing.",
    faqs: [
      {
        question: "Is it safe?",
        answer:
          "Payloads you type stay in your session; still avoid sharing sensitive tokens in screenshots.",
      },
      {
        question: "Does it work on mobile?",
        answer:
          "Yes — generate and save image directly to gallery.",
      },
      {
        question: "Can I use logos inside the QR?",
        answer:
          "If the tool supports logo inset, keep logos small to preserve scan reliability.",
      },
    ],
  },
  "pdf-to-excel": {
    metaTitle: "PDF to Excel Converter Online — Extract Tables | Clawdage",
    metaDescription:
      "Convert PDF tables to editable Excel spreadsheets in your browser. Useful for marksheets, invoices, and government forms.",
    keywords: ["pdf to excel", "pdf table to xlsx", "extract pdf tables India"],
    howToSteps: [
      "Upload your PDF with visible tables.",
      "Run extraction and review detected rows in the preview.",
      "Download XLSX or CSV for editing in Excel or Google Sheets.",
    ],
    whyTitle: "Why convert PDF to Excel?",
    whyParagraph:
      "Portals and offices often ship data as PDF only. Extracting tables locally helps students and accountants avoid retyping rows.",
    targetHeading: "Best for marksheets and structured annexures",
    targetBody:
      "Scanned PDFs may need OCR-quality source files. For native digital PDFs, extraction is faster. Always verify totals after export.",
    faqs: [
      {
        question: "Will formatting be perfect?",
        answer: "Complex merged cells may need manual cleanup — treat output as a starting point.",
      },
      {
        question: "Is my PDF uploaded?",
        answer: "Check the in-tool banner for browser vs cloud processing before sensitive documents.",
      },
      {
        question: "Works on mobile?",
        answer: "Small PDFs yes; large files are easier on desktop.",
      },
    ],
  },
  "excel-editor": {
    metaTitle: "Excel Editor Online — Edit XLSX & CSV in Browser | Clawdage",
    metaDescription:
      "View and edit Excel and CSV files online without installing Microsoft Excel. Spreadsheet editor for quick fixes before portal upload.",
    keywords: ["excel editor online", "edit xlsx browser", "csv editor India"],
    howToSteps: [
      "Open your XLSX or CSV file from your device.",
      "Edit cells, rows, and columns in the spreadsheet view.",
      "Export the updated file for upload or sharing.",
    ],
    whyTitle: "Why edit spreadsheets in the browser?",
    whyParagraph:
      "Cyber cafés and school labs may not have Excel licensed. A browser editor helps you fix headers and KB-heavy exports quickly.",
    targetHeading: "Students and small offices",
    targetBody:
      "Use for quick corrections — not a full replacement for macro-heavy workbooks. Save a backup before bulk edits.",
    faqs: [
      {
        question: "Is it safe?",
        answer: "Files stay local when the tool runs fully in-browser — read the processing notice.",
      },
      {
        question: "Macro support?",
        answer: "No VBA/macros — import data-only sheets.",
      },
      {
        question: "Large files?",
        answer: "Very large workbooks may be slow — split sheets if needed.",
      },
    ],
  },
  ocr: {
    metaTitle: "Handwriting to Text OCR — Hindi & Multi-Language (Pro Pass)",
    metaDescription:
      "Extract printed and handwritten text from images with AI. Useful for Hindi and English notes — pass-gated where required; private-by-design workflows.",
    keywords: [
      "handwriting to text converter Hindi",
      "image to text OCR India",
      "Groq vision OCR",
    ],
    howToSteps: [
      "Upload a clear photo or screenshot of the page.",
      "Pick language hints if the tool exposes them for better accuracy.",
      "Copy extracted text and proofread before filing forms.",
    ],
    whyTitle: "Why OCR in the browser stack?",
    whyParagraph:
      "Students digitize lecture notes; offices digitize signed forms. Pair OCR with manual review — no model is perfect on smudged ink.",
    targetHeading: "Best for classroom notes and quick digitization",
    targetBody:
      "For Hindi mixed with English, enable any bilingual hints offered. Shoot in daylight, align parallel to the page, and crop borders. If output garbles a line, rescan that paragraph only.",
    faqs: [
      {
        question: "Is it safe?",
        answer:
          "Assume sensitive pages should stay offline unless you trust the processing path shown in the tool. Pro flows may call cloud models — read notices.",
      },
      {
        question: "Does it work on mobile?",
        answer:
          "Yes — newer phones produce sharper photos for OCR.",
      },
      {
        question: "Why is a pass required?",
        answer:
          "Advanced OCR uses paid model capacity — passes keep the service sustainable.",
      },
    ],
  },
  "pdf-unlock": {
    metaTitle: "PDF Unlock Online — Remove PDF Password Free (India)",
    metaDescription:
      "Remove PDF password protection in your browser. Bulk unlock password-protected PDFs locally — no upload to cloud servers.",
    keywords: ["remove PDF password", "PDF unlock online", "unlock PDF India", "remove PDF encryption"],
    howToSteps: [
      "Drop your password-protected PDF (or multiple files for bulk unlock).",
      "Enter the document password if prompted.",
      "Download unlocked PDFs ready to merge, split, or upload to portals.",
    ],
    whyTitle: "Why unlock PDFs locally?",
    whyParagraph:
      "Bank statements and office PDFs are often password-locked. Unlocking in-browser keeps account numbers and personal data off third-party servers.",
    targetHeading: "Unlock bank statements and office PDFs safely",
    targetBody:
      "After unlocking, use Merge PDF or PDF to Excel on Clawdage for the next step. Always delete unlocked copies from shared computers.",
    faqs: [
      { question: "Is bulk unlock supported?", answer: "Yes — add multiple PDFs and unlock them one after another in your browser." },
      { question: "Will unlocking reduce quality?", answer: "No — pages are copied without re-scanning or re-compression." },
      { question: "What if I forgot the password?", answer: "This tool needs the correct password. It cannot crack unknown passwords." },
    ],
  },
  "pdf-split": {
    metaTitle: "PDF Split Online — Extract Pages & Split PDF Free",
    metaDescription:
      "Split PDF by page range, extract specific pages, or save every page as a separate file. Preview before export — 100% browser-side.",
    keywords: ["split PDF online", "extract PDF pages", "PDF split India", "separate PDF pages"],
    howToSteps: [
      "Upload your PDF and preview pages.",
      "Choose split by range, extract selected pages, or split every page.",
      "Download the resulting PDF file(s) instantly.",
    ],
    whyTitle: "Why split PDFs on Clawdage?",
    whyParagraph:
      "Exam forms, leases, and bank bundles often need only a few pages. Split locally instead of emailing full documents to random online tools.",
    targetHeading: "Extract annexures and statement pages",
    targetBody:
      "Use page ranges like 1-3,5,7-9 for multiple output files. Pair with PDF Unlock if your source file is password-protected.",
    faqs: [
      { question: "Can I preview before splitting?", answer: "Yes — scroll through page previews before you export." },
      { question: "Split every page?", answer: "Yes — each page downloads as its own PDF file." },
      { question: "Works on mobile?", answer: "Yes for smaller PDFs; large files are easier on desktop." },
    ],
  },
  "invoice-generator": {
    metaTitle: "Invoice Generator — GST Invoice & Thermal Receipt PDF India",
    metaDescription:
      "Create GST tax invoices and 80mm thermal receipts with logo, line items, CGST/SGST, and UPI QR payment. Export PDF for shops and freelancers.",
    keywords: ["GST invoice generator", "thermal receipt maker", "invoice PDF India", "UPI invoice QR"],
    howToSteps: [
      "Enter business details, GSTIN, and customer info.",
      "Add line items with HSN, qty, rate, and GST %.",
      "Export A4 GST invoice or thermal receipt PDF with optional UPI QR.",
    ],
    whyTitle: "Why generate invoices in the browser?",
    whyParagraph:
      "Small shops and Instagram sellers need quick bills without expensive billing software. Everything runs locally — your customer list stays on your device.",
    targetHeading: "Built for kirana stores, repair shops, and freelancers",
    targetBody:
      "Add your logo and UPI ID so customers can scan and pay. Use thermal mode for Bluetooth receipt printers that accept PDF or print from browser.",
    faqs: [
      { question: "Is GST calculation automatic?", answer: "Yes — CGST and SGST split from the GST % on each line item." },
      { question: "Thermal receipt size?", answer: "80 mm width layout optimized for common thermal printers." },
      { question: "Can I add UPI QR?", answer: "Yes — enter UPI ID and the QR is embedded on the invoice PDF." },
    ],
  },
  "signature-maker": {
    metaTitle: "Signature Maker — Digital Signature PNG Transparent",
    metaDescription:
      "Draw or type your signature, pick handwriting styles, and download transparent PNG. Stamp on PDFs with our E-Sign tool.",
    keywords: ["digital signature maker", "transparent signature PNG", "online signature India", "handwritten signature generator"],
    howToSteps: [
      "Draw your signature on canvas or type your name with a style.",
      "Preview on a transparent checkerboard background.",
      "Download PNG and use with E-Sign or any document.",
    ],
    whyTitle: "Why make signatures locally?",
    whyParagraph:
      "Exam forms, job applications, and rental agreements need clean signatures. A transparent PNG works on any background without white boxes.",
    targetHeading: "UPSC, SSC, and business document workflows",
    targetBody:
      "After exporting PNG, open the E-Sign tool to stamp directly on PDF. Typed styles mimic handwriting for quick approvals.",
    faqs: [
      { question: "Transparent background?", answer: "Yes — empty pixels are trimmed and exported as transparent PNG." },
      { question: "Handwriting styles?", answer: "Cursive, formal, bold, and handwritten font presets are available." },
      { question: "Use on PDF?", answer: "Yes — open E-Sign from the tool page to place your signature on PDFs." },
    ],
  },
  "bank-statement-to-excel": {
    metaTitle: "Bank Statement to Excel — PDF to XLSX Converter India",
    metaDescription:
      "Convert bank statement PDFs to Excel or CSV. Extract transactions, auto-categorize UPI/ATM/salary, export for accountants and loan applications.",
    keywords: ["bank statement to excel", "PDF bank statement converter", "statement to CSV India", "transaction extractor"],
    howToSteps: [
      "Upload a text-based bank statement PDF.",
      "Review extracted transactions and categories.",
      "Export XLSX or CSV for Excel, Tally, or loan documentation.",
    ],
    whyTitle: "Why convert statements locally?",
    whyParagraph:
      "Accountants and freelancers shouldn't upload full bank statements to unknown servers. Browser extraction keeps IFSC, account, and UPI details private.",
    targetHeading: "Accountants, freelancers, and loan applicants",
    targetBody:
      "Works best with digital PDFs from major Indian banks. Scanned image statements may need OCR first — then re-export as PDF.",
    faqs: [
      { question: "Which banks work?", answer: "Most text-based PDFs from HDFC, SBI, ICICI, Axis, and similar formats." },
      { question: "Auto categories?", answer: "UPI, ATM, salary, bills, and transfers are tagged heuristically — review before filing." },
      { question: "Scanned PDFs?", answer: "Image-only scans need OCR; text PDFs work best." },
    ],
  },
  "whatsapp-link": {
    metaTitle: "WhatsApp Click-to-Chat Link Generator — wa.me + QR",
    metaDescription:
      "Create WhatsApp click-to-chat links with country code, pre-filled message, and QR code. Free for Instagram bios, shop counters, and business cards.",
    keywords: ["WhatsApp link generator", "wa.me link", "WhatsApp QR code", "click to chat WhatsApp India"],
    howToSteps: [
      "Select country code and enter WhatsApp number.",
      "Add an optional pre-filled message for customers.",
      "Copy wa.me link or download QR for print and social media.",
    ],
    whyTitle: "Why use a WhatsApp link generator?",
    whyParagraph:
      "Customers tap once to message you — no saving contacts first. Perfect for Instagram shops, laptop repair counters, and freelancer portfolios.",
    targetHeading: "Instagram businesses and local shops",
    targetBody:
      "Default +91 India dial code. Pre-fill messages like product name or order ID so you know where the lead came from.",
    faqs: [
      { question: "Is the QR free?", answer: "Yes — generated instantly in your browser." },
      { question: "India country code?", answer: "India (+91) is the default; other countries are supported." },
      { question: "Works without saving contact?", answer: "Yes — wa.me opens chat directly in WhatsApp." },
    ],
  },
};

export function getToolSeoEntry(slug: string): ToolSeoEntry | undefined {
  return TOOL_SEO_BY_SLUG[slug];
}
