import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";

import { JsonLd } from "@/components/seo/json-ld";
import { getCategoryBySlug, getPublishedPost, type CategoryRow } from "@/lib/blog/queries";
import {
  buildArticleJsonLd,
  buildBreadcrumbListJsonLd,
} from "@/lib/seo/json-ld";
import { getSiteSeoSettings } from "@/lib/seo/site-settings";
import { getSiteUrl } from "@/lib/seo/site-url";
import { isReservedSlug } from "@/lib/seo/slugs";

export const revalidate = 86400;

type PageProps = { params: Promise<{ categorySlug: string; postSlug: string }> };

function categoryLabel(locale: string, cat: CategoryRow): string {
  return locale === "ar" ? cat.label_ar : cat.label_en || cat.label_ar;
}

function wordCountFromHtml(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return 0;
  return text.split(" ").filter(Boolean).length;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categorySlug, postSlug } = await params;
  if (isReservedSlug(categorySlug)) return {};

  const post = await getPublishedPost(categorySlug, postSlug);
  if (!post) return { title: "Not found" };

  const canonical = `${getSiteUrl()}/${categorySlug}/${postSlug}`;
  const title = post.meta_title || post.title;
  const description = (post.meta_description || post.title).slice(0, 160);
  const ogTitle = (post.og_title?.trim() || title).slice(0, 70);
  const ogDescription = (post.og_description?.trim() || description).slice(0, 200);
  const image = post.og_image?.trim() || post.cover_image || undefined;

  return {
    title,
    description,
    alternates: { canonical },
    robots: post.noindex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      type: "article",
      title: ogTitle,
      description: ogDescription,
      url: canonical,
      images: image ? [{ url: image, alt: post.cover_image_alt || title }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: ogTitle,
      description: ogDescription,
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
  const siteSeo = await getSiteSeoSettings(base);
  const publisherName = siteSeo.organizationSchema.name || "construction-egy";
  const publisherLogo = siteSeo.organizationSchema.logo;

  const articleJsonLd = buildArticleJsonLd({
    headline: post.title,
    description: post.meta_description || post.title,
    url: canonical,
    image: post.cover_image,
    datePublished: publishedDate,
    dateModified: post.updated_at,
    articleSection: label,
    keywords: post.seed_keyword || undefined,
    authorName: publisherName,
    publisherName,
    publisherLogo,
    inLanguage: locale === "ar" ? "ar" : "en",
    wordCount: wordCountFromHtml(post.content),
  });

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: locale === "ar" ? "الرئيسية" : "Home", url: base },
    { name: label, url: `${base}/${categorySlug}` },
    { name: post.title, url: canonical },
  ]);

  return (
    <>
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      {post.faq_schema ? <JsonLd data={post.faq_schema} /> : null}
      {post.howto_schema ? <JsonLd data={post.howto_schema} /> : null}
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

        {post.faq_schema && Array.isArray((post.faq_schema as any).mainEntity) ? (
          <section className="mt-10 border-t border-bina-border pt-6">
            <h2 className="text-xl font-bold text-bina-text">
              {locale === "ar" ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
            </h2>
            <div className="mt-4 space-y-3">
              {((post.faq_schema as any).mainEntity as Array<{ name: string; acceptedAnswer: { text: string } }>).map(
                (qa, i) => (
                  <details key={i} className="group rounded-lg border border-bina-border p-4">
                    <summary className="cursor-pointer font-semibold text-bina-text">{qa.name}</summary>
                    <p className="mt-2 text-sm text-bina-muted">{qa.acceptedAnswer?.text}</p>
                  </details>
                ),
              )}
            </div>
          </section>
        ) : null}
      </article>
    </>
  );
}
