import type { NextConfig } from 'next';

const nextConfig = {
  reactStrictMode: true,
  // Standalone output is what the Dockerfile copies.
  output: 'standalone',
  // Inlined at build time, so the server and the browser agree on the fallback
  // year the footer prints before it hydrates.
  env: { BUILD_YEAR: String(new Date().getFullYear()) },
  reactCompiler: true,
  poweredByHeader: false,
  allowedDevOrigins: ['localhost'],
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
} satisfies NextConfig;

export default nextConfig;
