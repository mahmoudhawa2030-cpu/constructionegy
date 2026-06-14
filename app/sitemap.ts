import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/seo/site-url";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/web`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/gallery`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    const supabase = await createClient();

    const [listingsRes, categoriesRes, postsRes] = await Promise.all([
      supabase
        .from("listings")
        .select("id, created_at")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(45000),
      supabase.from("categories").select("slug").eq("is_active", true),
      supabase
        .from("seo_posts")
        .select("category_slug, slug, updated_at")
        .eq("status", "published")
        .limit(45000),
    ]);

    const listingEntries: MetadataRoute.Sitemap = (listingsRes.data ?? []).map((l) => ({
      url: `${base}/listings/${l.id}`,
      lastModified: l.created_at ? new Date(l.created_at) : now,
      changeFrequency: "daily",
      priority: 0.7,
    }));

    const categoryEntries: MetadataRoute.Sitemap = (categoriesRes.data ?? []).map((c) => ({
      url: `${base}/${c.slug}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    }));

    const postEntries: MetadataRoute.Sitemap = (postsRes.data ?? []).map((p) => ({
      url: `${base}/${p.category_slug}/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : now,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...staticEntries, ...categoryEntries, ...postEntries, ...listingEntries];
  } catch (err) {
    console.error("[sitemap] failed to build dynamic entries", err);
    return staticEntries;
  }
}
