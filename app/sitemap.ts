import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/seo/site-url";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  // Primary public URLs only (canonical = /listings/*, not /web/* duplicates).
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/gallery`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const supabase = await createClient();

    const [listingsRes, categoriesRes, postsRes] = await Promise.all([
      supabase
        .from("listings")
        .select("id, created_at, images, title")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(45000),
      supabase
        .from("categories")
        .select("slug, updated_at")
        .eq("is_active", true),
      supabase
        .from("seo_posts")
        .select("category_slug, slug, updated_at, cover_image, title, noindex")
        .eq("status", "published")
        .limit(45000),
    ]);

    const listingEntries: MetadataRoute.Sitemap = (listingsRes.data ?? []).map((l) => {
      const lastMod = l.created_at ? new Date(l.created_at) : now;
      const firstImage = l.images?.[0];
      return {
        url: `${base}/listings/${l.id}`,
        lastModified: lastMod,
        changeFrequency: "daily" as const,
        priority: 0.7,
        // Direct CDN/storage URLs — not /_next/image (unstable for crawlers).
        images: firstImage ? [firstImage] : undefined,
      };
    });

    const categoryEntries: MetadataRoute.Sitemap = (categoriesRes.data ?? []).map((c) => ({
      url: `${base}/${c.slug}`,
      lastModified: c.updated_at ? new Date(c.updated_at) : now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));

    const postEntries: MetadataRoute.Sitemap = (postsRes.data ?? [])
      .filter((p) => !p.noindex)
      .map((p) => ({
        url: `${base}/${p.category_slug}/${p.slug}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
        images: p.cover_image ? [p.cover_image] : undefined,
      }));

    return [...staticEntries, ...categoryEntries, ...postEntries, ...listingEntries];
  } catch (err) {
    console.error("[sitemap] failed to build dynamic entries", err);
    return staticEntries;
  }
}
