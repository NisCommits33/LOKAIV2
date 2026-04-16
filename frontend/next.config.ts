import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Move allowedDevOrigins to the root as required by Next.js 15+
  // @ts-ignore - Some versions of @types/next may not have updated types for this field yet
  allowedDevOrigins: ["192.168.1.145"],
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
    // Updated from middlewareClientMaxBodySize to fix deprecation warning
    proxyClientMaxBodySize: "50mb",
  },
};

export default nextConfig;
