import type { NextConfig } from "next";
import path from "path";

const transformersNodeStub = path.join(process.cwd(), "lib/transformers-node-stub.js");
const onnxRuntimeNodeStub = path.join(process.cwd(), "lib/onnxruntime-node-stub.js");

const nextConfig: NextConfig = {
  transpilePackages: ["@xenova/transformers"],
  /**
   * Client-only: `@xenova/transformers` `env.js` calls `Object.keys(fs)`; Webpack must map Node
   * built-ins to a safe empty object. `onnxruntime-node` must not be resolved for the browser.
   * Nested `sharp` is replaced via `package.json` `overrides` (`lib/sharp-browser-empty`) so native
   * `.node` files are never bundled.
   * Use `next dev --webpack` / `next build --webpack` so these aliases apply (Turbopack is default in v16).
   */
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        fs: transformersNodeStub,
        path: transformersNodeStub,
        url: transformersNodeStub,
        "onnxruntime-node": onnxRuntimeNodeStub,
      };
    }
    return config;
  },
};

export default nextConfig;
