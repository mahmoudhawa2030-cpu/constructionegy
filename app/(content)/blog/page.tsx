import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { getAllPublishedPosts, getCategoryBySlug } from "@/lib/blog/queries";
import { getCategoryLabelMap } from "@/lib/categories/queries";
import { getSiteUrl } from "@/lib/seo/site-url";

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("blog");
  const base = getSiteUrl();
  const canonical = `${base}/blog`;

  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      title: t("title"),
      description: t("subtitle"),
      url: canonical,
    },
    twitter: { card: "summary", title: t("title"), description: t("subtitle") },
  };
}

export default async function BlogIndexPage() {
  const [locale, t, posts, categoryLabelMap] = await Promise.all([
    getLocale(),
    getTranslations("blog"),
    getAllPublishedPosts(100),
    getCategoryLabelMap(),
  ]);

  const base = getSiteUrl();

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: t("title"),
    description: t("subtitle"),
    url: `${base}/blog`,
    blogPost: posts.slice(0, 20).map((p) => ({
      "@type": "BlogPosting",
      headline: p.meta_title || p.title,
      url: `${base}/${p.category_slug}/${p.slug}`,
      datePublished: p.publish_at ?? p.created_at,
      dateModified: p.updated_at,
      articleSection: categoryLabelMap[p.category_slug] ?? p.category_slug,
    })),
  };

  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
        type="application/ld+json"
      />

      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-bina-text sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-bina-muted">
            {t("subtitle")}
          </p>
        </header>

        {/* Post grid */}
        {posts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-bina-border p-12 text-center text-sm text-bina-muted">
            {t("empty")}
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              const catLabel = categoryLabelMap[post.category_slug] ?? post.category_slug;
              const publishedDate = post.publish_at ?? post.created_at;
              const wordCount = post.content
                ? post.content.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length
                : 0;

              return (
                <li key={post.id}>
                  <Link
                    className="group flex h-full flex-col overflow-hidden rounded-xl border border-bina-border bg-white transition hover:shadow-md"
                    href={`/${post.category_slug}/${post.slug}`}
                  >
                    {post.cover_image ? (
                      <div className="relative aspect-[16/9] w-full bg-zinc-100">
                        <Image
                          alt={post.cover_image_alt || post.title}
                          className="object-cover"
                          fill
                          loading="lazy"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          src={post.cover_image}
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-[16/9] w-full items-center justify-center bg-zinc-50">
                        <span className="text-3xl">📝</span>
                      </div>
                    )}

                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <div className="flex items-center gap-2 text-xs text-bina-muted">
                        <Link
                          className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-bina-text transition hover:bg-zinc-200"
                          href={`/${post.category_slug}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {catLabel}
                        </Link>
                        <span>·</span>
                        <time dateTime={publishedDate}>
                          {new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }).format(new Date(publishedDate))}
                        </time>
                        {wordCount > 0 && (
                          <>
                            <span>·</span>
                            <span>
                              {new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US").format(
                                wordCount,
                              )}{" "}
                              {t("words")}
                            </span>
                          </>
                        )}
                      </div>

                      <h2 className="font-semibold leading-snug text-bina-text group-hover:text-bina-or">
                        {post.meta_title || post.title}
                      </h2>

                      {post.meta_description && (
                        <p className="line-clamp-2 text-sm leading-relaxed text-bina-muted">
                          {post.meta_description}
                        </p>
                      )}

                      <span className="mt-auto pt-2 text-xs font-semibold text-bina-or">
                        {t("readMore")} →
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
