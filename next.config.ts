import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { loader: "custom", loaderFile: "./lib/image-loader.ts", qualities: [75, 85] },
  serverExternalPackages: [],
  experimental: { serverActions: { bodySizeLimit: "25mb" } },
  // Files uploaded after a production build are not in the build's public/ snapshot; serve them via the API route.
  async rewrites() {
    return { beforeFiles: [], afterFiles: [], fallback: [{ source: "/media/:file", destination: "/api/media/:file" }] };
  },
};

export default nextConfig;
