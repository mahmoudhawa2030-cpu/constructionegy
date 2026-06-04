import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/seo/site-url";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/api",
        "/profile",
        "/messages",
        "/bookings",
        "/favorites",
        "/notifications",
        "/login",
        "/signup",
        "/auth",
        "/protected",
        "/account-suspended",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
