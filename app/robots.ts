import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/seo/site-url";

/** Build-safe robots.txt (no DB / cookies). */
export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api",
          "/login",
          "/signup",
          "/profile",
          "/messages",
          "/bookings",
          "/favorites",
          "/notifications",
          "/auth",
          "/protected",
          "/account-suspended",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
