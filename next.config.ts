import type { NextConfig } from "next";

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  reactCompiler: true,
  poweredByHeader: false,
  allowedDevOrigins: ["localhost"],
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
} satisfies NextConfig;

export default nextConfig;
