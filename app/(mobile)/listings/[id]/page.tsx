import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { Breadcrumb } from "@/components/breadcrumb";
import { ListingCard } from "@/components/listing-card";
import { ListingContact } from "@/components/listing-contact";
import { ListingFavoriteHeart } from "@/components/listing-favorite-heart";
import { ListingGalleryStickyBar } from "@/components/listing-gallery-sticky-bar";
import { ListingShareButton } from "@/components/listing-share-button";
import { ListingImageGallery } from "@/components/listing-image-gallery";
import { ListingSellerCard } from "@/components/listing-seller-card";
import { ListingViewTracker } from "@/components/listing-view-tracker";
import { getCategoryLabelMap } from "@/lib/categories/queries";
import { labelForCategorySlug } from "@/lib/listings/categories";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 60;

const typeLabels = { rent: "إيجار", sell: "بيع" } as const;
const conditionLabels = { new: "جديد", used: "مستعمل" } as const;

type PageProps = { params: Promise<{ id: string }> };

export default async function ListingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

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

  const priceFmt = new Intl.NumberFormat("ar-EG", {
    maximumFractionDigits: 0,
  }).format(Number(listing.price));

  const categoryLabelMap = await getCategoryLabelMap();
  const categoryLabel = labelForCategorySlug(listing.category, categoryLabelMap);

  const viewCount = listing.view_count ?? 0;
  const viewsFmt = new Intl.NumberFormat("ar-EG").format(viewCount);
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

  return (
    <div className="mx-auto w-full max-w-[1280px] px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <ListingViewTracker listingId={listing.id} skip={isOwner} />

      {/* Mobile sticky bar (above the fold on phones) */}
      {hasImages ? (
        <div className="sm:hidden -mx-3 mb-3">
          <ListingGalleryStickyBar
            initialFavorited={isFavorited}
            isLoggedIn={Boolean(user)}
            listingId={listing.id}
            priceLine={`${priceFmt} ${listing.price_unit}`}
            shareUrl={shareUrl}
            title={listing.title}
          />
        </div>
      ) : null}

      <div className="hidden sm:block mb-4">
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
          هذا الإعلان <strong>قيد المراجعة</strong>. لن يظهر في المعرض العام حتى تعتمد الإدارة
          حالته إلى «منشور».
        </div>
      ) : null}

      {listing.status === "paused" ? (
        <div className="mb-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-100">
          هذا الإعلان <strong>متوقف مؤقتاً</strong> ولا يظهر في المعرض. لإعادة الظهور استخدم «إعادة النشر» في
          صفحة{" "}
          <Link
            className="font-semibold underline"
            href={isOwner ? "/users/myads" : `/users/${listing.user_id}/ads`}
          >
            جميع إعلاناتك
          </Link>
          .
        </div>
      ) : null}

      {/* Main card: gallery (left) + product info (right) */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="grid grid-cols-1 lg:grid-cols-[560px_1fr]">
          {/* Left: gallery */}
          <div className="border-b border-zinc-100 p-4 sm:p-5 lg:border-b-0 lg:border-r dark:border-zinc-800">
            {hasImages ? (
              <ListingImageGallery images={listing.images!} title={listing.title} />
            ) : (
              <div className="flex h-[20rem] items-center justify-center rounded-lg bg-zinc-100 text-sm text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                لا توجد صور
              </div>
            )}
          </div>

          {/* Right: product info */}
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

            {/* Info table */}
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
                  النوع
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

            {/* Seller card */}
            <ListingSellerCard
              avatarUrl={sellerProfile?.avatar_url ?? null}
              createdAt={sellerProfile?.created_at ?? null}
              fullName={sellerProfile?.full_name ?? null}
              isOwner={isOwner}
              lastSeenAt={sellerProfile?.last_seen_at ?? null}
              userId={listing.user_id}
            />

            {/* Contact CTA */}
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

      {/* Related products */}
      {similarListings && similarListings.length > 0 ? (
        <section className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              إعلانات مشابهة
            </h2>
            <Link
              className="text-sm font-medium text-bina-or hover:underline"
              href={`/gallery?category=${encodeURIComponent(listing.category)}`}
            >
              عرض الكل ←
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

      {/* Description card */}
      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-100 px-5 py-4 sm:px-6 dark:border-zinc-800">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">الوصف</h2>
        </div>
        <div className="px-5 py-5 sm:px-6 sm:py-6">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {listing.description || "لا يوجد وصف."}
          </p>
        </div>
      </div>
    </div>
  );
}
