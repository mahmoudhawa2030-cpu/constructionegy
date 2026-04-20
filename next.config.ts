import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Produces a standalone output folder for Docker deployment (Hetzner etc.)
  // Safe to leave on for Vercel — Vercel ignores it.
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/**",
      },
      // Self-hosted storage (MinIO on Hetzner) — set NEXT_PUBLIC_STORAGE_BASE_URL when active
      {
        protocol: "https",
        hostname: process.env.NEXT_PUBLIC_STORAGE_BASE_URL
          ? new URL(process.env.NEXT_PUBLIC_STORAGE_BASE_URL).hostname
          : "storage.example.com",
      },
    ],
  },
  // RFQ pages must not be cached by CDN/browser after deploy (Capacitor WebView often pins the production origin).
  async headers() {
    return [
      {
        source: "/rfq",
        headers: [{ key: "Cache-Control", value: "private, no-store, must-revalidate" }],
      },
      {
        source: "/rfq/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store, must-revalidate" }],
      },
    ];
  },
  // Default server-action multipart limit is 1 MB; RFQ bid attachments allow up to 10 MB per file.
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default withNextIntl(nextConfig);
