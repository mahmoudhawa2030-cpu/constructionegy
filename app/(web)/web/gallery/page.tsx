import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { ListingCard } from "@/components/listing-card";
import { MetaSearchTracker } from "@/components/meta-search-tracker";
import { getCategoryLabelMap } from "@/lib/categories/queries";
import { isReservedSlug } from "@/lib/seo/slugs";
import { createClient } from "@/lib/supabase/server";


export const dynamic = "force-dynamic";

const SLUG_RE = /^[a-z][a-z0-9_]*$/;

type PageProps = {
  searchParams: Promise<{ category?: string | string[]; q?: string | string[] }>;
};

export default async function WebGalleryPage({ searchParams }: PageProps) {
  const raw = await searchParams;

  const rawCat = raw.category;
  const categoryParam = Array.isArray(rawCat) ? rawCat[0] : rawCat;
  const categorySlug =
    typeof categoryParam === "string" && SLUG_RE.test(categoryParam.trim())
      ? categoryParam.trim()
      : null;

  const rawQ = raw.q;
  const searchQuery = typeof rawQ === "string" ? rawQ.trim() : Array.isArray(rawQ) ? rawQ[0].trim() : null;

  // SEO: consolidate old ?category= URLs into clean /{slug} paths.
  if (categorySlug && !isReservedSlug(categorySlug)) {
    permanentRedirect(`/${categorySlug}`);
  }

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
  if (searchQuery) {
    query = query.ilike("title", `%${searchQuery}%`);
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

  const t = await getTranslations("gallery");

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
      {searchQuery ? <MetaSearchTracker query={searchQuery} /> : null}
      {/* Page heading */}
      <div className="flex flex-col gap-1">

        <h1 className="font-bina-display text-2xl font-bold tracking-wide text-zinc-900">
          {filteredLabel
            ? t.rich("titleFiltered", {
                category: filteredLabel,
                muted: (chunks) => (
                  <span className="text-zinc-400">{chunks}</span>
                ),
              })
            : t("titleAll")}
        </h1>
        <p className="text-sm leading-relaxed text-zinc-500">
          {filteredLabel ? (
            <>
              {t("activeInCategory")}{" "}
              <Link className="font-medium text-[var(--bina-primary)] underline underline-offset-2" href="/gallery">
                {t("showAll")}
              </Link>
              {" · "}
            </>
          ) : (
            <>{t("browseActive")} </>
          )}
          {t("toAdd")}{" "}
          <Link className="font-medium text-[var(--bina-primary)] underline underline-offset-2" href="/listings/new">
            {t("addListingLink")}
          </Link>{" "}
          {t("requiresLogin")}
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {t("loadError")}
        </p>
      ) : null}

      {!error && (!listings || listings.length === 0) ? (
        <div className="rounded-xl border border-dashed border-zinc-200 p-10 text-center text-sm text-zinc-400">
          {filteredLabel ? (
            <>
              {t("emptyFiltered", { category: filteredLabel })}{" "}
              <Link className="font-medium text-[var(--bina-primary)] underline underline-offset-2" href="/gallery">
                {t("browseAllCategories")}
              </Link>
            </>
          ) : (
            <>
              {t("empty")}{" "}
              <Link className="font-medium text-[var(--bina-primary)] underline underline-offset-2" href="/login?next=/listings/new">
                {t("loginThen")}
              </Link>{" "}
              {t("then")}{" "}
              <Link className="font-medium text-[var(--bina-primary)] underline underline-offset-2" href="/listings/new">
                {t("addListing")}
              </Link>
              .
            </>
          )}
        </div>
      ) : null}

      {listings && listings.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
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
