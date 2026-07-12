"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/admin";
import { submitIndexNow } from "@/lib/seo/indexnow";
import { getSiteUrl } from "@/lib/seo/site-url";
import { isReservedSlug, slugify } from "@/lib/seo/slugs";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type SavePostInput = {
  id?: string;
  categorySlug: string;
  seedKeyword: string;
  title: string;
  slug: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  coverImage: string | null;
  coverImageAlt: string | null;
  seoScore: number;
  status: "draft" | "published";
  publishAt: string | null;
  faqSchema?: Record<string, unknown> | null;
  howtoSchema?: Record<string, unknown> | null;
  noindex?: boolean;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
};

export type SaveResult = { ok: true; id: string } | { ok: false; error: string };

export async function savePost(input: SavePostInput): Promise<SaveResult> {
  const { user } = await requireAdmin();
  const supabase = await createClient();

  const title = input.title.trim();
  if (!title) return { ok: false, error: "Title is required." };

  const categorySlug = input.categorySlug.trim();
  if (!categorySlug) return { ok: false, error: "Category is required." };

  let slug = slugify(input.slug || input.title);
  if (!slug) return { ok: false, error: "Slug is required." };
  if (isReservedSlug(slug)) slug = `${slug}-post`;

  const row = {
    category_slug: categorySlug,
    seed_keyword: input.seedKeyword.trim(),
    title,
    slug,
    content: input.content,
    meta_title: input.metaTitle.trim().slice(0, 70),
    meta_description: input.metaDescription.trim().slice(0, 200),
    cover_image: input.coverImage,
    cover_image_alt: input.coverImageAlt,
    seo_score: Math.max(0, Math.min(100, Math.round(input.seoScore))),
    status: input.status,
    publish_at:
      input.status === "published" && !input.publishAt
        ? new Date().toISOString()
        : input.publishAt,
    faq_schema: (input.faqSchema ?? null) as Json,
    howto_schema: (input.howtoSchema ?? null) as Json,
    noindex: input.noindex ?? false,
    og_title: input.ogTitle?.trim() || null,
    og_description: input.ogDescription?.trim() || null,
    og_image: input.ogImage?.trim() || null,
  };

  if (input.id) {
    const { error } = await supabase.from("seo_posts").update(row).eq("id", input.id);
    if (error) return { ok: false, error: error.message };
    revalidatePaths(categorySlug, slug);
    if (input.status === "published" && !input.noindex) {
      void submitIndexNow(`${getSiteUrl()}/${categorySlug}/${slug}`);
    }
    return { ok: true, id: input.id };
  }

  const { data, error } = await supabase
    .from("seo_posts")
    .insert({ ...row, author_id: user.id })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePaths(categorySlug, slug);
  if (input.status === "published" && !input.noindex) {
    void submitIndexNow(`${getSiteUrl()}/${categorySlug}/${slug}`);
  }
  return { ok: true, id: data.id };
}

export async function deletePost(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("seo_posts").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/blog");
  return { ok: true };
}

function revalidatePaths(categorySlug: string, slug: string) {
  revalidatePath("/admin/blog");
  revalidatePath(`/${categorySlug}`);
  revalidatePath(`/${categorySlug}/${slug}`);
}
