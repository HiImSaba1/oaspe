import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  allowedDevOrigins: ["127.0.0.1"],
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  experimental: { cpus: 1 },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "oaspe.org", pathname: "/wp-content/uploads/**" }],
  },
};

export default nextConfig;
