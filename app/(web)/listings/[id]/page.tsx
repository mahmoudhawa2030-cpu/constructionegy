import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { Breadcrumb } from "@/components/breadcrumb";
import { ListingCard } from "@/components/listing-card";
import { ListingContact } from "@/components/listing-contact";
import { ListingFavoriteHeart } from "@/components/listing-favorite-heart";
import { ListingShareButton } from "@/components/listing-share-button";
import { ListingImageGallery } from "@/components/listing-image-gallery";
import { ListingSellerCard } from "@/components/listing-seller-card";
import { ListingViewTracker } from "@/components/listing-view-tracker";
import { getCategoryLabelMap } from "@/lib/categories/queries";
import { labelForCategorySlug } from "@/lib/listings/categories";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 60;

type PageProps = { params: Promise<{ id: string }> };

function timeAgoKey(iso: string): { key: string; count: number } {
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return { key: "justNow", count: 0 };
  const min = Math.floor(sec / 60);
  if (min < 60) return { key: "minutesAgo", count: min };
  const hr = Math.floor(min / 60);
  if (hr < 24) return { key: "hoursAgo", count: hr };
  const day = Math.floor(hr / 24);
  if (day < 30) return { key: "daysAgo", count: day };
  const mo = Math.floor(day / 30);
  if (mo < 12) return { key: "monthsAgo", count: mo };
  const yr = Math.floor(mo / 12);
  return { key: "yearsAgo", count: yr };
}

export default async function WebListingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const t = await getTranslations("listingDetail");
  const locale = await getLocale();

  const { data: listing, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (error || !listing) {
    notFound();
  }

  const [sellerResult, countResult, similarResult, categoryLabelMap] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, avatar_url, created_at, last_seen_at")
        .eq("id", listing.user_id)
        .maybeSingle(),
      supabase
        .from("listings")
        .select("*", { count: "exact", head: true })
        .eq("user_id", listing.user_id)
        .eq("status", "active"),
      supabase
        .from("listings")
        .select("*")
        .eq("category", listing.category)
        .eq("status", "active")
        .neq("id", listing.id)
        .order("created_at", { ascending: false })
        .limit(10),
      getCategoryLabelMap(),
    ]);

  const sellerProfile = sellerResult.data;
  const activeAdsCount = countResult.count;
  const similarListings = similarResult.data;

  let similarFavoritedIds = new Set<string>();
  if (user && similarListings && similarListings.length > 0) {
    const ids = similarListings.map((l) => l.id);
    const { data: favRows } = await supabase
      .from("listing_favorites")
      .select("listing_id")
      .eq("user_id", user.id)
      .in("listing_id", ids);
    if (favRows) {
      similarFavoritedIds = new Set(favRows.map((r) => r.listing_id));
    }
  }

  let isFavorited = false;
  if (user) {
    const { data: favRow } = await supabase
      .from("listing_favorites")
      .select("listing_id")
      .eq("user_id", user.id)
      .eq("listing_id", listing.id)
      .maybeSingle();
    isFavorited = Boolean(favRow);
  }

  const numberLocale = locale === "ar" ? "ar-EG" : "en-US";
  const priceFmt = new Intl.NumberFormat(numberLocale, {
    maximumFractionDigits: 0,
  }).format(Number(listing.price));

  const categoryLabel = labelForCategorySlug(listing.category, categoryLabelMap);
  const viewCount = listing.view_count ?? 0;
  const viewsFmt = new Intl.NumberFormat(numberLocale).format(viewCount);
  const isOwner = Boolean(user?.id === listing.user_id);
  const hasImages = Boolean(listing.images && listing.images.length > 0);

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  const envBase = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "").trim();
  const shareOrigin =
    envBase && envBase.length > 0 ? envBase : host ? `${proto}://${host}` : "";
  const shareUrl = shareOrigin ? `${shareOrigin}/listings/${listing.id}` : "";

  const ago = timeAgoKey(listing.created_at);
  const timeAgoLabel =
    ago.key === "justNow" ? t("justNow") : t(ago.key, { count: ago.count });

  const memberSinceYear = sellerProfile?.created_at
    ? new Intl.DateTimeFormat(numberLocale, { year: "numeric" }).format(
        new Date(sellerProfile.created_at),
      )
    : null;

  const sellerName =
    sellerProfile?.full_name?.trim() || (locale === "ar" ? "مستخدم" : "User");
  const shortAdId = listing.id.replace(/-/g, "").slice(0, 9).toUpperCase();

  const typeLabels =
    locale === "ar"
      ? ({ rent: "إيجار", sell: "بيع" } as const)
      : ({ rent: "Rent", sell: "Sale" } as const);
  const conditionLabels =
    locale === "ar"
      ? ({ new: "جديد", used: "مستعمل" } as const)
      : ({ new: "New", used: "Used" } as const);

  return (
    <>
      <ListingViewTracker listingId={listing.id} skip={isOwner} />

      <div className="mx-auto w-full max-w-[1280px] px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-4">
          <Breadcrumb
            items={[
              { label: locale === "ar" ? "المعرض" : "Gallery", href: "/gallery" },
              {
                label: categoryLabel,
                href: `/gallery?category=${encodeURIComponent(listing.category)}`,
              },
              { label: listing.title },
            ]}
          />
        </div>

        {/* Status banners */}
        {listing.status === "pending" ? (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            {locale === "ar"
              ? "هذا الإعلان قيد المراجعة."
              : "This listing is pending review."}
          </div>
        ) : null}
        {listing.status === "paused" ? (
          <div className="mb-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
            {locale === "ar" ? "متوقف مؤقتاً" : "Paused"}
          </div>
        ) : null}

        {/* Main card */}
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-[560px_1fr]">
            {/* Gallery */}
            <div className="border-b border-zinc-100 p-4 sm:p-5 lg:border-b-0 lg:border-e">
              {hasImages ? (
                <ListingImageGallery images={listing.images!} title={listing.title} />
              ) : (
                <div className="flex h-[20rem] items-center justify-center rounded-lg bg-zinc-100 text-sm text-zinc-500">
                  {locale === "ar" ? "لا توجد صور" : "No images"}
                </div>
              )}
            </div>

            {/* Details column */}
            <div className="flex flex-col gap-4 p-5 sm:p-6 lg:p-7">
              {/* Category + title + icons */}
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--bina-primary)]">
                  {categoryLabel}
                </p>
                <div className="flex items-start justify-between gap-3">
                  <h1 className="min-w-0 flex-1 text-xl font-bold leading-snug text-zinc-900 sm:text-2xl md:text-[1.65rem]">
                    {listing.title}
                  </h1>
                  <div className="flex shrink-0 items-center gap-2" dir="ltr">
                    <ListingFavoriteHeart
                      initialFavorited={isFavorited}
                      isLoggedIn={Boolean(user)}
                      listingId={listing.id}
                    />
                    <ListingShareButton title={listing.title} url={shareUrl} />
                  </div>
                </div>
              </div>

              {/* Spec table */}
              <div className="overflow-hidden rounded-xl border border-zinc-100 text-sm">
                <div className="flex items-center border-b border-zinc-100">
                  <span className="w-32 shrink-0 border-e border-zinc-100 bg-zinc-50 px-4 py-3 font-medium text-zinc-500">
                    {locale === "ar" ? "السعر" : "Price"}
                  </span>
                  <div className="px-4 py-3">
                    <span className="text-2xl font-bold text-[var(--bina-primary)] tabular-nums">
                      {priceFmt}
                    </span>{" "}
                    <span className="text-sm text-zinc-600">{listing.price_unit}</span>
                  </div>
                </div>
                <div className="flex items-center border-b border-zinc-100">
                  <span className="w-32 shrink-0 border-e border-zinc-100 bg-zinc-50 px-4 py-3 font-medium text-zinc-500">
                    {t("type")}
                  </span>
                  <span className="px-4 py-3 font-semibold text-zinc-800">
                    {typeLabels[listing.type]} · {conditionLabels[listing.condition]}
                  </span>
                </div>
                {listing.location ? (
                  <div className="flex items-center border-b border-zinc-100">
                    <span className="w-32 shrink-0 border-e border-zinc-100 bg-zinc-50 px-4 py-3 font-medium text-zinc-500">
                      {locale === "ar" ? "الموقع" : "Location"}
                    </span>
                    <span className="px-4 py-3 text-zinc-800">
                      📍 {listing.location}
                    </span>
                  </div>
                ) : null}
                <div className="flex items-center border-b border-zinc-100">
                  <span className="w-32 shrink-0 border-e border-zinc-100 bg-zinc-50 px-4 py-3 font-medium text-zinc-500">
                    {locale === "ar" ? "تاريخ النشر" : "Posted"}
                  </span>
                  <span className="px-4 py-3 text-zinc-600 text-xs">{timeAgoLabel}</span>
                </div>
                {isOwner ? (
                  <div className="flex items-center">
                    <span className="w-32 shrink-0 border-e border-zinc-100 bg-zinc-50 px-4 py-3 font-medium text-zinc-500">
                      {locale === "ar" ? "المشاهدات" : "Views"}
                    </span>
                    <span className="px-4 py-3 tabular-nums text-zinc-800">{viewsFmt}</span>
                  </div>
                ) : null}
              </div>

              {/* Seller card */}
              <ListingSellerCard
                avatarUrl={sellerProfile?.avatar_url ?? null}
                createdAt={sellerProfile?.created_at ?? null}
                fullName={sellerProfile?.full_name ?? null}
                isOwner={isOwner}
                lastSeenAt={sellerProfile?.last_seen_at ?? null}
                userId={listing.user_id}
              />

              {/* Contact + Ad ID */}
              <div className="mt-auto pt-2">
                <ListingContact
                  isLoggedIn={Boolean(user)}
                  isOwner={isOwner}
                  listingId={listing.id}
                />
                <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
                  <span>
                    {t("adId")} <span className="font-bold tracking-wider text-zinc-700">{shortAdId}</span>
                  </span>
                  <button
                    className="flex items-center gap-1 text-zinc-500 hover:text-zinc-800 transition-colors"
                    type="button"
                  >
                    <svg aria-hidden className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                      <line x1="4" y1="22" x2="4" y2="15" />
                    </svg>
                    <span>{t("reportThisAd")}</span>
                  </button>
                </div>
                {isOwner ? (
                  <Link
                    className="mt-3 inline-block text-sm font-medium text-zinc-900 underline"
                    href={`/listings/${listing.id}/edit`}
                  >
                    {locale === "ar" ? "تعديل الإعلان" : "Edit listing"}
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-100 px-5 py-4 sm:px-6">
            <h2 className="text-lg font-bold text-zinc-900">{t("description")}</h2>
          </div>
          <div className="px-5 py-5 sm:px-6">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
              {listing.description || t("noDescription")}
            </p>
          </div>
        </div>

        {/* Similar listings */}
        {similarListings && similarListings.length > 0 ? (
          <section className="mt-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900">{t("similarTitle")}</h2>
              <Link
                className="text-sm font-medium text-[var(--bina-primary)] hover:underline"
                href={`/gallery?category=${encodeURIComponent(listing.category)}`}
              >
                {t("viewAll")} →
              </Link>
            </div>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {similarListings.map((row) => (
                <li key={row.id}>
                  <ListingCard
                    categoryLabelMap={categoryLabelMap}
                    favorite={{
                      initialFavorited: similarFavoritedIds.has(row.id),
                      isLoggedIn: Boolean(user),
                      loginReturnTo: `/listings/${listing.id}`,
                    }}
                    listing={row}
                    viewerUserId={user?.id ?? null}
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  );
}
