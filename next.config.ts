import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/**",
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
