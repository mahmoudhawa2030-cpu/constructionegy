import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { SeoEditor, type SeoEditorCategory } from "@/components/admin/seo-editor";
import { getActiveCategoriesForSelect } from "@/lib/categories/queries";
import { adminUi } from "@/lib/admin-ui";
import { getSiteUrl } from "@/lib/seo/site-url";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditBlogPostPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: post }, cats, locale, t] = await Promise.all([
    supabase.from("seo_posts").select("*").eq("id", id).maybeSingle(),
    getActiveCategoriesForSelect(),
    getLocale(),
    getTranslations("adminBlog"),
  ]);

  if (!post) {
    notFound();
  }

  const categories: SeoEditorCategory[] = cats.map((c) => ({ slug: c.slug, label: c.label_ar }));

  return (
    <div className={adminUi.page}>
      <div className="flex items-center justify-between">
        <h1 className={adminUi.pageTitle}>{t("editPost")}</h1>
        <Link className={adminUi.linkBack} href="/admin/blog">
          {t("back")}
        </Link>
      </div>
      <SeoEditor
        categories={categories}
        initial={{
          id: post.id,
          categorySlug: post.category_slug,
          seedKeyword: post.seed_keyword,
          title: post.title,
          slug: post.slug,
          content: post.content,
          metaTitle: post.meta_title,
          metaDescription: post.meta_description,
          coverImage: post.cover_image,
          coverImageAlt: post.cover_image_alt,
          status: post.status === "published" ? "published" : "draft",
          publishAt: post.publish_at,
        }}
        locale={locale === "ar" ? "ar" : "en"}
        siteUrl={getSiteUrl()}
      />
    </div>
  );
}
