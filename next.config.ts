import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["react-pdf", "pdfjs-dist"],
  // Server Actions default body cap is 1 MB. Next requires a finite limit; set high for large uploads.
  // Hosting (e.g. Vercel) may still enforce its own request size limits.
  experimental: {
    serverActions: {
      bodySizeLimit: "1gb",
    },
  },
};

export default nextConfig;
