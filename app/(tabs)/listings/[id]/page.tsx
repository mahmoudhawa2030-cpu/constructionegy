import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumb } from "@/components/breadcrumb";
import { ListingContact } from "@/components/listing-contact";
import { ListingFavoriteHeart } from "@/components/listing-favorite-heart";
import { ListingImageGallery } from "@/components/listing-image-gallery";
import { ListingSellerCard } from "@/components/listing-seller-card";
import { ListingViewTracker } from "@/components/listing-view-tracker";
import { getCategoryLabelMap } from "@/lib/categories/queries";
import { labelForCategorySlug } from "@/lib/listings/categories";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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

  const sellerAside = (
    <aside className={`flex flex-col gap-4 ${hasImages ? "order-2 lg:order-1" : ""}`}>
      <ListingSellerCard
        avatarUrl={sellerProfile?.avatar_url ?? null}
        createdAt={sellerProfile?.created_at ?? null}
        fullName={sellerProfile?.full_name ?? null}
        isOwner={isOwner}
        lastSeenAt={sellerProfile?.last_seen_at ?? null}
        userId={listing.user_id}
      />
      <ListingContact
        isLoggedIn={Boolean(user)}
        isOwner={Boolean(user?.id === listing.user_id)}
        listingId={listing.id}
      />
    </aside>
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-7 sm:py-10">
      <ListingViewTracker listingId={listing.id} skip={isOwner} />
      <div className="flex flex-col gap-3">
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
        {user?.id === listing.user_id ? (
          <Link
            className="w-fit text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
            href={`/listings/${listing.id}/edit`}
          >
            تعديل الإعلان
          </Link>
        ) : null}
      </div>

      {listing.status === "pending" ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
          هذا الإعلان <strong>قيد المراجعة</strong>. لن يظهر في المعرض العام حتى تعتمد الإدارة
          حالته إلى «منشور».
        </div>
      ) : null}

      {listing.status === "paused" ? (
        <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-100">
          هذا الإعلان <strong>متوقف مؤقتاً</strong> ولا يظهر في المعرض. لإعادة الظهور استخدم «إعادة النشر» في
          صفحة{" "}
          <Link className="font-semibold underline" href={`/users/${listing.user_id}/ads`}>
            جميع إعلاناتك
          </Link>
          .
        </div>
      ) : null}

      <div className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="min-w-0 flex-1 text-2xl font-semibold leading-snug text-zinc-900 sm:text-[1.75rem] dark:text-zinc-50">
            {listing.title}
          </h1>
          <ListingFavoriteHeart
            initialFavorited={isFavorited}
            isLoggedIn={Boolean(user)}
            listingId={listing.id}
          />
        </div>
        <p className="text-sm text-zinc-600 sm:text-base dark:text-zinc-400">
          {categoryLabel} · {typeLabels[listing.type]} · {conditionLabels[listing.condition]}
          {listing.status === "pending" ? " · قيد المراجعة" : null}
          {" · "}
          <span className="tabular-nums">{viewsFmt} مشاهدة</span>
        </p>
        <p className="text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
          {priceFmt} {listing.price_unit}
        </p>
        {listing.location ? (
          <p className="text-sm text-zinc-600 sm:text-base dark:text-zinc-400">
            📍 {listing.location}
          </p>
        ) : null}
      </div>

      {hasImages ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] lg:items-start lg:gap-8">
          {sellerAside}
          <div className="order-1 min-w-0 lg:order-2">
            <ListingImageGallery images={listing.images!} title={listing.title} />
          </div>
        </div>
      ) : (
        sellerAside
      )}

      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
        <h2 className="mb-2 text-base font-semibold text-zinc-900 dark:text-zinc-50">الوصف</h2>
        <p className="whitespace-pre-wrap text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
          {listing.description || "لا يوجد وصف."}
        </p>
      </div>
    </div>
  );
}
