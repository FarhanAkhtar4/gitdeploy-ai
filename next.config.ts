import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Cloudflare Pages: Do NOT use output: "standalone" — next-on-pages handles output */
  /* output: "standalone" conflicts with @cloudflare/next-on-pages */

  /* Skip TypeScript errors during build (Cloudflare build speed) */
  typescript: {
    ignoreBuildErrors: true,
  },

  reactStrictMode: false,

  /* Cloudflare Edge Runtime optimizations */
  experimental: {
    /* Enable server actions (already default in Next.js 16) */
  },

  /* External packages that should not be bundled (Node.js-only deps) */
  serverExternalPackages: [
    "sharp",
    "@prisma/client",
    "prisma",
  ],

  /* Image optimization - use Cloudflare Image Resizing instead of Next.js built-in */
  images: {
    unoptimized: true, // Cloudflare handles image optimization via its CDN
  },
};

export default nextConfig;
