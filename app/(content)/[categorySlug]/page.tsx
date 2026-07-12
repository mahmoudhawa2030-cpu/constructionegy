import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { Breadcrumb } from "@/components/breadcrumb";
import { ListingCard } from "@/components/listing-card";
import { JsonLd } from "@/components/seo/json-ld";
import { getCategoryLabelMap } from "@/lib/categories/queries";
import {
  getCategoryBySlug,
  getPublishedPostsByCategory,
  type CategoryRow,
} from "@/lib/blog/queries";
import { buildBreadcrumbListJsonLd } from "@/lib/seo/json-ld";
import { getSiteUrl } from "@/lib/seo/site-url";
import { isReservedSlug } from "@/lib/seo/slugs";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 600;

type PageProps = { params: Promise<{ categorySlug: string }> };

function pickLocale<T>(locale: string, ar: T, en: T): T {
  return locale === "ar" ? ar : en;
}

function categoryLabel(locale: string, cat: CategoryRow): string {
  return pickLocale(locale, cat.label_ar, cat.label_en || cat.label_ar);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categorySlug } = await params;
  if (isReservedSlug(categorySlug)) return {};

  const cat = await getCategoryBySlug(categorySlug);
  if (!cat) return { title: "Not found" };

  const locale = await getLocale();
  const label = categoryLabel(locale, cat);
  const seoTitle = pickLocale(locale, cat.seo_title_ar, cat.seo_title_en) || `${label}`;
  const seoDesc =
    pickLocale(locale, cat.seo_description_ar, cat.seo_description_en) ||
    pickLocale(locale, cat.intro_ar, cat.intro_en) ||
    label;
  const canonical = `${getSiteUrl()}/${categorySlug}`;

  return {
    title: seoTitle,
    description: seoDesc.slice(0, 155),
    alternates: { canonical },
    robots: cat.is_active ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      type: "website",
      title: seoTitle,
      description: seoDesc.slice(0, 155),
      url: canonical,
    },
    twitter: { card: "summary", title: seoTitle, description: seoDesc.slice(0, 155) },
  };
}

export default async function CategoryLandingPage({ params }: PageProps) {
  const { categorySlug } = await params;
  if (isReservedSlug(categorySlug)) {
    notFound();
  }

  const cat = await getCategoryBySlug(categorySlug);
  if (!cat || !cat.is_active) {
    notFound();
  }

  const locale = await getLocale();
  const t = await getTranslations("category");
  const label = categoryLabel(locale, cat);
  const intro = pickLocale(locale, cat.intro_ar, cat.intro_en);

  const supabase = await createClient();
  const [{ data: listings }, posts, categoryLabelMap, userRes] = await Promise.all([
    supabase
      .from("listings")
      .select("*")
      .eq("category", categorySlug)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(24),
    getPublishedPostsByCategory(categorySlug, 6),
    getCategoryLabelMap(),
    supabase.auth.getUser(),
  ]);

  const user = userRes.data.user;
  const base = getSiteUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: label,
    url: `${base}/${categorySlug}`,
    description: intro || label,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: (listings ?? []).slice(0, 10).map((l, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${base}/listings/${l.id}`,
        name: l.title,
      })),
    },
  };

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: locale === "ar" ? "الرئيسية" : "Home", url: base },
    { name: t("marketplace"), url: `${base}/gallery` },
    { name: label, url: `${base}/${categorySlug}` },
  ]);

  return (
    <>
      <JsonLd data={jsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-6">
          <div className="mb-2">
            <Breadcrumb
              baseUrl={base}
              items={[
                { label: t("marketplace"), href: "/gallery" },
                { label },
              ]}
            />
          </div>
          <h1 className="text-2xl font-bold text-bina-text sm:text-3xl">{label}</h1>
          {intro ? (
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-bina-muted sm:text-base">
              {intro}
            </p>
          ) : null}
        </header>

        {/* Articles */}
        {posts.length > 0 ? (
          <section className="mb-10">
            <h2 className="mb-4 text-lg font-bold text-bina-text sm:text-xl">
              {t("articles")}
            </h2>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <li key={post.id}>
                  <Link
                    className="group flex h-full flex-col overflow-hidden rounded-xl border border-bina-border bg-white transition hover:shadow-md"
                    href={`/${categorySlug}/${post.slug}`}
                  >
                    {post.cover_image ? (
                      <div className="relative aspect-[16/9] w-full bg-zinc-100">
                        <Image
                          alt={post.cover_image_alt || post.title}
                          className="object-cover"
                          fill
                          sizes="(max-width: 640px) 100vw, 33vw"
                          src={post.cover_image}
                        />
                      </div>
                    ) : null}
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="font-semibold leading-snug text-bina-text group-hover:text-bina-or">
                        {post.title}
                      </h3>
                      {post.meta_description ? (
                        <p className="mt-2 line-clamp-3 text-sm text-bina-muted">
                          {post.meta_description}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Listings */}
        <section>
          <h2 className="mb-4 text-lg font-bold text-bina-text sm:text-xl">
            {t("listings")}
          </h2>
          {listings && listings.length > 0 ? (
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {listings.map((row) => (
                <li key={row.id}>
                  <ListingCard
                    categoryLabelMap={categoryLabelMap}
                    listing={row}
                    viewerUserId={user?.id ?? null}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-bina-border p-8 text-center text-sm text-bina-muted">
              {t("noListings")}
            </p>
          )}
        </section>
      </div>
    </>
  );
}
