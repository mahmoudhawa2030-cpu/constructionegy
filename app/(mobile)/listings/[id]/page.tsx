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
import { ListingImageGalleryMobile } from "@/components/listing-image-gallery-mobile";
import { ListingMobileActionBar } from "@/components/listing-mobile-action-bar";
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

export default async function ListingDetailPage({ params }: PageProps) {
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

  const { data: sellerProfile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, created_at, last_seen_at")
    .eq("id", listing.user_id)
    .maybeSingle();

  const { count: activeAdsCount } = await supabase
    .from("listings")
    .select("*", { count: "exact", head: true })
    .eq("user_id", listing.user_id)
    .eq("status", "active");

  const { data: similarListings } = await supabase
    .from("listings")
    .select("*")
    .eq("category", listing.category)
    .eq("status", "active")
    .neq("id", listing.id)
    .order("created_at", { ascending: false })
    .limit(10);

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

  const numberLocale = locale === "ar" ? "ar-EG" : "en-US";
  const priceFmt = new Intl.NumberFormat(numberLocale, {
    maximumFractionDigits: 0,
  }).format(Number(listing.price));

  const categoryLabelMap = await getCategoryLabelMap();
  const categoryLabel = labelForCategorySlug(listing.category, categoryLabelMap);

  const viewCount = listing.view_count ?? 0;
  const viewsFmt = new Intl.NumberFormat(numberLocale).format(viewCount);
  const isOwner = Boolean(user?.id === listing.user_id);
  const hasImages = Boolean(listing.images && listing.images.length > 0);

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

      {/* ============ MOBILE: OLX-style layout (hidden md+) ============ */}
      <div className="md:hidden bg-white text-zinc-900">
        {/* Edge-to-edge gallery */}
        {hasImages ? (
          <ListingImageGalleryMobile
            backHref="/gallery"
            images={listing.images!}
            searchHref="/gallery"
            title={listing.title}
          />
        ) : (
          <div
            className="relative w-full bg-zinc-100"
            style={{ aspectRatio: "1 / 1" }}
          >
            <Link
              aria-label={t("back")}
              className="absolute start-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-zinc-900 shadow-md"
              href="/gallery"
            >
              <svg
                aria-hidden
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.2}
                viewBox="0 0 24 24"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </Link>
          </div>
        )}

        {/* Content */}
        <div className="px-4 pb-24 pt-4">
          {/* Status alerts */}
          {listing.status === "pending" ? (
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
              قيد المراجعة
            </div>
          ) : null}
          {listing.status === "paused" ? (
            <div className="mb-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-950">
              متوقف مؤقتاً
            </div>
          ) : null}

          {/* Price + heart/share */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold leading-tight tabular-nums">
                {listing.price_unit} {priceFmt}
              </h1>
              <p className="mt-1 text-sm leading-snug text-zinc-700 line-clamp-2">
                {listing.title}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2" dir="ltr">
              <ListingFavoriteHeart
                initialFavorited={isFavorited}
                isLoggedIn={Boolean(user)}
                listingId={listing.id}
              />
              <ListingShareButton title={listing.title} url={shareUrl} />
            </div>
          </div>

          {/* Location + time row */}
          <div className="mt-3 flex items-center justify-between gap-3 border-b border-zinc-200 pb-4">
            <div className="flex min-w-0 flex-1 items-center gap-1.5 text-sm text-zinc-700">
              <svg
                aria-hidden
                className="h-4 w-4 shrink-0 text-zinc-500"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className="truncate">{listing.location || categoryLabel}</span>
            </div>
            <span className="shrink-0 text-xs text-zinc-500">{timeAgoLabel}</span>
          </div>

          {/* Details */}
          <h2 className="mt-5 text-lg font-bold">{t("details")}</h2>
          <div className="mt-2 overflow-hidden rounded-lg border border-zinc-200">
            <div className="flex border-b border-zinc-200">
              <div className="w-1/3 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-600">
                {t("type")}
              </div>
              <div className="flex-1 px-3 py-2.5 text-sm font-semibold">
                {typeLabels[listing.type]}
              </div>
            </div>
            <div className="flex">
              <div className="w-1/3 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-600">
                {t("condition")}
              </div>
              <div className="flex-1 px-3 py-2.5 text-sm font-semibold">
                {conditionLabels[listing.condition]}
              </div>
            </div>
          </div>

          {/* Description */}
          <h2 className="mt-5 text-lg font-bold">{t("description")}</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
            {listing.description || t("noDescription")}
          </p>

          {/* Posted By card */}
          <Link
            className="mt-5 flex flex-col rounded-xl border border-zinc-200 p-3 active:bg-zinc-50"
            href={isOwner ? "/profile" : `/profile/${listing.user_id}`}
          >
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                {sellerProfile?.avatar_url ? (
                  <Image
                    alt={sellerName}
                    className="object-cover"
                    fill
                    sizes="48px"
                    src={sellerProfile.avatar_url}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-zinc-400">
                    <svg
                      aria-hidden
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      viewBox="0 0 24 24"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-zinc-500">{t("postedBy")}</p>
                <p className="truncate font-semibold">{sellerName}</p>
              </div>
              <svg
                aria-hidden
                className="h-5 w-5 shrink-0 text-zinc-400 rtl:rotate-180"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </div>
            <div className="mt-3 flex gap-6 border-t border-zinc-200 pt-3">
              <div className="flex items-center gap-2">
                <svg
                  aria-hidden
                  className="h-5 w-5 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  viewBox="0 0 24 24"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <div>
                  <p className="text-xs text-zinc-500">{t("memberSince")}</p>
                  <p className="text-sm font-bold">{memberSinceYear ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  aria-hidden
                  className="h-5 w-5 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  viewBox="0 0 24 24"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <div>
                  <p className="text-xs text-zinc-500">{t("activeAds")}</p>
                  <p className="text-sm font-bold tabular-nums">
                    {new Intl.NumberFormat(numberLocale).format(activeAdsCount ?? 0)}
                  </p>
                </div>
              </div>
            </div>
          </Link>

          {/* Ad ID + Report */}
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-zinc-700">
              {t("adId")} <span className="font-bold tracking-wider">{shortAdId}</span>
            </span>
            <button
              className="flex items-center gap-1.5 text-zinc-700 active:text-zinc-900"
              type="button"
            >
              <svg
                aria-hidden
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" y1="22" x2="4" y2="15" />
              </svg>
              <span className="font-medium">{t("reportThisAd")}</span>
            </button>
          </div>

          {/* Owner-only edit link */}
          {isOwner ? (
            <Link
              className="mt-3 inline-block text-sm font-medium text-zinc-900 underline"
              href={`/listings/${listing.id}/edit`}
            >
              تعديل الإعلان
            </Link>
          ) : null}

          {/* Similar Ads */}
          {similarListings && similarListings.length > 0 ? (
            <section className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold">{t("similarTitle")}</h2>
                <Link
                  className="text-sm font-medium text-bina-or"
                  href={`/gallery?category=${encodeURIComponent(listing.category)}`}
                >
                  {t("viewAll")}
                </Link>
              </div>
              <ul className="grid grid-cols-2 gap-3">
                {similarListings.slice(0, 6).map((row) => (
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

        {/* Sticky bottom action bar (Chat + Call) */}
        <ListingMobileActionBar
          isLoggedIn={Boolean(user)}
          isOwner={isOwner}
          listingId={listing.id}
        />
      </div>

      {/* ============ DESKTOP: existing 2-column layout (md+) ============ */}
      <div className="hidden md:block">
        <div className="mx-auto w-full max-w-[1280px] px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
          <div className="mb-4">
            <Breadcrumb
              items={[
                { label: "المعرض", href: "/gallery" },
                {
                  label: categoryLabel,
                  href: `/gallery?category=${encodeURIComponent(listing.category)}`,
                },
                { label: listing.title },
              ]}
            />
          </div>

          {listing.status === "pending" ? (
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
              هذا الإعلان <strong>قيد المراجعة</strong>.
            </div>
          ) : null}

          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="grid grid-cols-1 lg:grid-cols-[560px_1fr]">
              <div className="border-b border-zinc-100 p-4 sm:p-5 lg:border-b-0 lg:border-r dark:border-zinc-800">
                {hasImages ? (
                  <ListingImageGallery images={listing.images!} title={listing.title} />
                ) : (
                  <div className="flex h-[20rem] items-center justify-center rounded-lg bg-zinc-100 text-sm text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                    لا توجد صور
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4 p-5 sm:p-6 lg:p-7">
                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-bina-or">
                    {categoryLabel}
                  </p>
                  <div className="flex items-start justify-between gap-3">
                    <h1 className="min-w-0 flex-1 text-xl font-bold leading-snug text-zinc-900 sm:text-2xl md:text-[1.65rem] dark:text-zinc-50">
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

                <div className="overflow-hidden rounded-xl border border-zinc-100 text-sm dark:border-zinc-800">
                  <div className="flex items-center border-b border-zinc-100 dark:border-zinc-800">
                    <span className="w-32 shrink-0 border-r border-zinc-100 bg-zinc-50 px-4 py-3 font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                      السعر
                    </span>
                    <div className="px-4 py-3">
                      <span className="text-2xl font-bold text-bina-or tabular-nums">
                        {priceFmt}
                      </span>{" "}
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        {listing.price_unit}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center border-b border-zinc-100 dark:border-zinc-800">
                    <span className="w-32 shrink-0 border-r border-zinc-100 bg-zinc-50 px-4 py-3 font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                      {t("type")}
                    </span>
                    <span className="px-4 py-3 font-semibold text-zinc-800 dark:text-zinc-200">
                      {typeLabels[listing.type]} · {conditionLabels[listing.condition]}
                    </span>
                  </div>
                  {listing.location ? (
                    <div className="flex items-center border-b border-zinc-100 dark:border-zinc-800">
                      <span className="w-32 shrink-0 border-r border-zinc-100 bg-zinc-50 px-4 py-3 font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                        الموقع
                      </span>
                      <span className="px-4 py-3 text-zinc-800 dark:text-zinc-200">
                        📍 {listing.location}
                      </span>
                    </div>
                  ) : null}
                  {isOwner ? (
                    <div className="flex items-center">
                      <span className="w-32 shrink-0 border-r border-zinc-100 bg-zinc-50 px-4 py-3 font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                        المشاهدات
                      </span>
                      <span className="px-4 py-3 tabular-nums text-zinc-800 dark:text-zinc-200">
                        {viewsFmt}
                      </span>
                    </div>
                  ) : null}
                </div>

                <ListingSellerCard
                  avatarUrl={sellerProfile?.avatar_url ?? null}
                  createdAt={sellerProfile?.created_at ?? null}
                  fullName={sellerProfile?.full_name ?? null}
                  isOwner={isOwner}
                  lastSeenAt={sellerProfile?.last_seen_at ?? null}
                  userId={listing.user_id}
                />

                <div className="mt-auto pt-2">
                  <ListingContact
                    isLoggedIn={Boolean(user)}
                    isOwner={isOwner}
                    listingId={listing.id}
                  />
                  {isOwner ? (
                    <Link
                      className="mt-3 inline-block text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
                      href={`/listings/${listing.id}/edit`}
                    >
                      تعديل الإعلان
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {similarListings && similarListings.length > 0 ? (
            <section className="mt-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  {t("similarTitle")}
                </h2>
                <Link
                  className="text-sm font-medium text-bina-or hover:underline"
                  href={`/gallery?category=${encodeURIComponent(listing.category)}`}
                >
                  {t("viewAll")} ←
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

          <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="border-b border-zinc-100 px-5 py-4 sm:px-6 dark:border-zinc-800">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                {t("description")}
              </h2>
            </div>
            <div className="px-5 py-5 sm:px-6 sm:py-6">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                {listing.description || t("noDescription")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
