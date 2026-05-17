/** @type {import('next-sitemap').IConfig} */

const SEO_LANDING_SLUGS = [
  "aadhaar-photo-resize-online",
  "pan-card-photo-resizer",
  "pan-card-image-resizer",
  "passport-photo-maker-india",
  "ssc-photo-resizer",
  "upsc-signature-resizer",
  "neet-photo-resizer",
  "pdf-compressor-for-government-portal",
  "online-self-attestation-tool",
  "online-signature-resizer",
  "jpg-to-pdf-india",
  "image-resize-for-exam-forms",
  "resize-photo-for-ssc",
  "resize-photo-for-upsc",
  "resize-photo-for-neet",
  "resize-photo-for-railway-exam",
];

const BLOG_SLUGS = [
  "resize-aadhaar-card-images-government-portals",
  "best-passport-photo-size-indian-applications",
  "compress-pdf-without-losing-quality",
  "ssc-signature-resize-guide",
  "neet-photo-upload-requirements",
  "how-to-resize-ssc-photos-online",
  "create-transparent-signatures-for-forms",
];

const COMPARE_SLUGS = ["jpg-vs-png", "merge-pdf-vs-compress-pdf", "ocr-vs-manual-typing", "webp-vs-jpg"];

module.exports = {
  siteUrl: process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://clawdage.com",
  generateRobotsTxt: true,
  exclude: ["/api/*", "/auth/callback", "/admin/*"],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/auth/callback", "/admin/"],
      },
    ],
  },
  changefreq: "daily",
  priority: 0.8,
  additionalPaths: async () => {
    const landing = SEO_LANDING_SLUGS.map((slug) => ({
      loc: `/${slug}`,
      changefreq: "weekly",
      priority: 0.9,
      lastmod: new Date().toISOString(),
    }));
    const blog = [
      { loc: "/blog", changefreq: "weekly", priority: 0.75, lastmod: new Date().toISOString() },
      ...BLOG_SLUGS.map((slug) => ({
        loc: `/blog/${slug}`,
        changefreq: "monthly",
        priority: 0.7,
        lastmod: new Date().toISOString(),
      })),
    ];
    const compare = COMPARE_SLUGS.map((slug) => ({
      loc: `/compare/${slug}`,
      changefreq: "monthly",
      priority: 0.65,
      lastmod: new Date().toISOString(),
    }));
    const hubs = [
      { loc: "/exam-tools", changefreq: "weekly", priority: 0.85, lastmod: new Date().toISOString() },
      { loc: "/contact", changefreq: "monthly", priority: 0.5, lastmod: new Date().toISOString() },
    ];
    return [...landing, ...blog, ...compare, ...hubs];
  },
  transform: async (_config, path) => {
    const isHighPriority =
      path === "/" || path.startsWith("/tools") || SEO_LANDING_SLUGS.some((s) => path === `/${s}`);
    return {
      loc: path,
      changefreq: isHighPriority ? "daily" : "weekly",
      priority: isHighPriority ? 1.0 : 0.7,
      lastmod: new Date().toISOString(),
    };
  },
};
