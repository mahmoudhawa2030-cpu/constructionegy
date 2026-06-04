import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { SeoEditor, type SeoEditorCategory } from "@/components/admin/seo-editor";
import { getActiveCategoriesForSelect } from "@/lib/categories/queries";
import { adminUi } from "@/lib/admin-ui";
import { getSiteUrl } from "@/lib/seo/site-url";

export const dynamic = "force-dynamic";

export default async function NewBlogPostPage() {
  const [cats, locale, t] = await Promise.all([
    getActiveCategoriesForSelect(),
    getLocale(),
    getTranslations("adminBlog"),
  ]);

  const categories: SeoEditorCategory[] = cats.map((c) => ({
    slug: c.slug,
    label: c.label_ar,
  }));

  return (
    <div className={adminUi.page}>
      <div className="flex items-center justify-between">
        <h1 className={adminUi.pageTitle}>{t("newPost")}</h1>
        <Link className={adminUi.linkBack} href="/admin/blog">
          {t("back")}
        </Link>
      </div>
      <SeoEditor
        categories={categories}
        initial={{
          categorySlug: categories[0]?.slug ?? "",
          seedKeyword: "",
          title: "",
          slug: "",
          content: "",
          metaTitle: "",
          metaDescription: "",
          coverImage: null,
          coverImageAlt: null,
          status: "draft",
          publishAt: null,
        }}
        locale={locale === "ar" ? "ar" : "en"}
        siteUrl={getSiteUrl()}
      />
    </div>
  );
}
