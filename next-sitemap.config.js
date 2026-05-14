/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  generateRobotsTxt: true,
  exclude: ["/api/*", "/auth/callback"],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/auth/callback"],
      },
    ],
  },
  changefreq: "daily",
  priority: 0.8,
  transform: async (_config, path) => {
    const isToolOrHome = path === "/" || path.startsWith("/tools");
    return {
      loc: path,
      changefreq: isToolOrHome ? "daily" : "weekly",
      priority: isToolOrHome ? 1.0 : 0.7,
      lastmod: new Date().toISOString(),
    };
  },
};
