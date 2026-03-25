import Link from "next/link";

import { ListingCard } from "@/components/listing-card";
import { getCategoryLabelMap } from "@/lib/categories/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SLUG_RE = /^[a-z][a-z0-9_]*$/;

type PageProps = {
  searchParams: Promise<{ category?: string | string[] }>;
};

export default async function GalleryPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const rawCat = raw.category;
  const categoryParam = Array.isArray(rawCat) ? rawCat[0] : rawCat;
  const categorySlug =
    typeof categoryParam === "string" && SLUG_RE.test(categoryParam.trim())
      ? categoryParam.trim()
      : null;

  const supabase = await createClient();
  let query = supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(48);

  if (categorySlug) {
    query = query.eq("category", categorySlug);
  }

  const { data: listings, error } = await query;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const favoritedIds = new Set<string>();
  if (user && listings && listings.length > 0) {
    const ids = listings.map((l) => l.id);
    const { data: favRows } = await supabase
      .from("listing_favorites")
      .select("listing_id")
      .eq("user_id", user.id)
      .in("listing_id", ids);
    for (const r of favRows ?? []) {
      favoritedIds.add(r.listing_id);
    }
  }

  const categoryLabelMap = await getCategoryLabelMap();
  const favoriteLoginReturnTo = categorySlug
    ? `/gallery?category=${encodeURIComponent(categorySlug)}`
    : "/gallery";
  const filteredLabel = categorySlug ? (categoryLabelMap[categorySlug] ?? categorySlug) : null;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-3 px-3 py-5 sm:gap-4 sm:px-4 sm:py-6">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl dark:text-zinc-50">
          {filteredLabel ? (
            <>
              المعرض — <span className="text-zinc-700 dark:text-zinc-300">{filteredLabel}</span>
            </>
          ) : (
            "المعرض — الإعلانات"
          )}
        </h1>
        <p className="text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-400">
          {filteredLabel ? (
            <>
              إعلانات نشطة في هذا التصنيف.{" "}
              <Link className="font-medium text-zinc-900 underline dark:text-zinc-100" href="/gallery">
                عرض كل الإعلانات
              </Link>
              {" · "}
            </>
          ) : (
            <>
              تصفح الإعلانات النشطة.{" "}
            </>
          )}
          لإضافة إعلان{" "}
          <Link className="font-medium text-zinc-900 underline dark:text-zinc-100" href="/listings/new">
            افتح صفحة «إضافة إعلان»
          </Link>{" "}
          (يتطلب تسجيل الدخول).
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          تعذر تحميل الإعلانات. تأكد من تطبيق migration العلنية على Supabase (ملف
          20260323140000_listings_public_read_anon.sql) ثم أعد المحاولة.
        </p>
      ) : null}

      {!error && (!listings || listings.length === 0) ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
          {filteredLabel ? (
            <>
              لا توجد إعلانات في «{filteredLabel}» حالياً.{" "}
              <Link className="font-medium text-zinc-900 underline dark:text-zinc-100" href="/gallery">
                تصفح كل التصنيفات
              </Link>
            </>
          ) : (
            <>
              لا توجد إعلانات بعد.{" "}
              <Link className="font-medium text-zinc-900 underline dark:text-zinc-100" href="/login?next=/listings/new">
                سجّل الدخول
              </Link>{" "}
              ثم{" "}
              <Link className="font-medium text-zinc-900 underline dark:text-zinc-100" href="/listings/new">
                أضف إعلاناً
              </Link>
              .
            </>
          )}
        </div>
      ) : null}

      {listings && listings.length > 0 ? (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3 md:grid-cols-3 lg:gap-4 xl:grid-cols-4">
          {listings.map((row) => (
            <li key={row.id}>
              <ListingCard
                categoryLabelMap={categoryLabelMap}
                favorite={{
                  initialFavorited: favoritedIds.has(row.id),
                  isLoggedIn: Boolean(user),
                  loginReturnTo: favoriteLoginReturnTo,
                }}
                listing={row}
                viewerUserId={user?.id ?? null}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
