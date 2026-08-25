import type { NextConfig } from 'next';

const nextConfig = {
  reactStrictMode: true,
  // Next 16.3 + Vercel's adapter omits next-server.js.nft.json when
  // standalone is on, then onBuildComplete fails looking for it.
  // Keep standalone for Docker; Vercel sets VERCEL=1.
  // https://github.com/vercel/next.js/issues/96646
  output: process.env.VERCEL ? undefined : 'standalone',
  reactCompiler: true,
  poweredByHeader: false,
  allowedDevOrigins: ['localhost'],
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
} satisfies NextConfig;

export default nextConfig;
