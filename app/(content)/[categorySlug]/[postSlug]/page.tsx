import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";

import { getCategoryBySlug, getPublishedPost, type CategoryRow } from "@/lib/blog/queries";
import { getSiteUrl } from "@/lib/seo/site-url";
import { isReservedSlug } from "@/lib/seo/slugs";

export const revalidate = 86400;

type PageProps = { params: Promise<{ categorySlug: string; postSlug: string }> };

function categoryLabel(locale: string, cat: CategoryRow): string {
  return locale === "ar" ? cat.label_ar : cat.label_en || cat.label_ar;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categorySlug, postSlug } = await params;
  if (isReservedSlug(categorySlug)) return {};

  const post = await getPublishedPost(categorySlug, postSlug);
  if (!post) return { title: "Not found" };

  const canonical = `${getSiteUrl()}/${categorySlug}/${postSlug}`;
  const title = post.meta_title || post.title;
  const description = (post.meta_description || post.title).slice(0, 160);
  const image = post.cover_image ?? undefined;

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      type: "article",
      title,
      description,
      url: canonical,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { categorySlug, postSlug } = await params;
  if (isReservedSlug(categorySlug)) {
    notFound();
  }

  const [post, cat] = await Promise.all([
    getPublishedPost(categorySlug, postSlug),
    getCategoryBySlug(categorySlug),
  ]);

  if (!post || !cat) {
    notFound();
  }

  const locale = await getLocale();
  const label = categoryLabel(locale, cat);
  const base = getSiteUrl();
  const canonical = `${base}/${categorySlug}/${postSlug}`;
  const publishedDate = post.publish_at ?? post.created_at;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.meta_description || post.title,
    image: post.cover_image ? [post.cover_image] : undefined,
    datePublished: publishedDate,
    dateModified: post.updated_at,
    articleSection: label,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: label, item: `${base}/${categorySlug}` },
      { "@type": "ListItem", position: 2, name: post.title, item: canonical },
    ],
  };

  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        type="application/ld+json"
      />
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        type="application/ld+json"
      />
      <article className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
        <nav className="mb-4 text-xs text-bina-muted">
          <Link className="hover:underline" href={`/${categorySlug}`}>
            {label}
          </Link>
        </nav>

        <h1 className="text-3xl font-bold leading-tight text-bina-text sm:text-4xl">
          {post.title}
        </h1>

        <p className="mt-3 text-sm text-bina-muted">
          {new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }).format(new Date(publishedDate))}
        </p>

        {post.cover_image ? (
          <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-xl bg-zinc-100">
            <Image
              alt={post.cover_image_alt || post.title}
              className="object-cover"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              src={post.cover_image}
            />
          </div>
        ) : null}

        <div
          className="prose-blog mt-8"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </>
  );
}
