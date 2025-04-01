import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizeCss: true,
  },
  env: {
    NEXT_PUBLIC_HIDE_OVERLAY: "true",
  },
};

export default nextConfig;