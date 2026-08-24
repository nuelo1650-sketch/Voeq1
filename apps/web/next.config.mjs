/** @type {import('next').NextConfig} */
import path from "path";

const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    // Monorepo alias fix: ensure "@/..." resolves to THIS app dir (apps/web)
    // regardless of where Next.js computes baseUrl (Vercel runs the workspace
    // build from the repo root, which makes "@/x" resolve to repo-root/x and
    // fail on Linux). Map "@" -> apps/web explicitly.
    config.resolve.alias["@"] = path.resolve(process.cwd(), ".");
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  // D.7/D.8 — Vercel↔Render split.
  // When NEXT_PUBLIC_API_URL is set (Vercel web deploy), proxy /api/* to the
  // Render API origin server-side. The browser still calls same-origin /api/*
  // so no client code changes and no CORS on the hot path. On Render itself
  // this var is the Render URL (or unset) so /api is served natively.
  async rewrites() {
    const api = process.env.NEXT_PUBLIC_API_URL;
    if (!api) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${api}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
