import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { loader: "custom", loaderFile: "./lib/image-loader.ts" },
  serverExternalPackages: [],
  experimental: { serverActions: { bodySizeLimit: "25mb" } },
};

export default nextConfig;
