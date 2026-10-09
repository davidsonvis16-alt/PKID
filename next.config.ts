import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Applications carry a resized passport photo and document thumbnails.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
};

export default nextConfig;
