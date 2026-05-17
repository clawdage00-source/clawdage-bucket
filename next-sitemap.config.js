/** @type {import('next-sitemap').IConfig} */

const SEO_LANDING_SLUGS = [
  "aadhaar-photo-resize-online",
  "pan-card-photo-resizer",
  "passport-photo-maker-india",
  "ssc-photo-resizer",
  "upsc-signature-resizer",
  "neet-photo-resizer",
  "pdf-compressor-for-government-portal",
  "online-self-attestation-tool",
  "jpg-to-pdf-india",
  "image-resize-for-exam-forms",
];

const BLOG_SLUGS = [
  "resize-aadhaar-card-images-government-portals",
  "best-passport-photo-size-indian-applications",
  "compress-pdf-without-losing-quality",
  "ssc-signature-resize-guide",
  "neet-photo-upload-requirements",
];

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
    return [...landing, ...blog];
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
