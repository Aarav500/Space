import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Prevent /dashboard/coverage/[hash].js 404s in production
  // by disabling source map generation in prod
  productionBrowserSourceMaps: false,
};

export default nextConfig;
