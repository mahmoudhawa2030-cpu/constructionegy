import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { ListingFavoriteHeart } from "@/components/listing-favorite-heart";
import { labelForCategorySlug } from "@/lib/listings/categories";
import type { Database } from "@/lib/supabase/database.types";

type ListingRow = Database["public"]["Tables"]["listings"]["Row"];

export type ListingCardFavoriteProps = {
  initialFavorited: boolean;
  isLoggedIn: boolean;
  /** Login `next` for the card heart when logged out (e.g. `/gallery?category=…`). */
  loginReturnTo?: string;
};

type Props = {
  listing: ListingRow;
  categoryLabelMap?: Record<string, string>;
  /** When it matches `listing.user_id`, view count is shown (owner only). */
  viewerUserId?: string | null;
  /** When set, shows compact favorite control on the image. */
  favorite?: ListingCardFavoriteProps;
};

function listingRelativeAge(iso: string, locale: string): string {
  const diffSec = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  const rtf = new Intl.RelativeTimeFormat(locale === "ar" ? "ar" : "en", { numeric: "auto" });
  if (diffSec < 60) {
    return rtf.format(-diffSec, "second");
  }
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return rtf.format(-diffMin, "minute");
  }
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 48) {
    return rtf.format(-diffH, "hour");
  }
  const diffD = Math.floor(diffH / 24);
  if (diffD < 14) {
    return rtf.format(-diffD, "day");
  }
  const diffW = Math.floor(diffD / 7);
  if (diffW < 8) {
    return rtf.format(-diffW, "week");
  }
  const diffMo = Math.floor(diffD / 30);
  return rtf.format(-Math.max(1, diffMo), "month");
}

export async function ListingCard({ listing, categoryLabelMap, viewerUserId, favorite }: Props) {
  const locale = await getLocale();
  const t = await getTranslations("listingCard");
  const numberLocale = locale === "ar" ? "ar-EG" : "en-US";

  const typeLabels: Record<ListingRow["type"], string> = {
    rent: t("rent"),
    sell: t("sell"),
  };

  const conditionLabels: Record<ListingRow["condition"], string> = {
    new: t("new"),
    used: t("used"),
  };

  const thumb = listing.images?.[0];
  const priceFmt = new Intl.NumberFormat(numberLocale, {
    maximumFractionDigits: 0,
  }).format(Number(listing.price));
  const showViews = Boolean(viewerUserId && viewerUserId === listing.user_id);
  const viewsFmt = showViews
    ? new Intl.NumberFormat(numberLocale).format(listing.view_count ?? 0)
    : null;

  return (
    <div className="relative">
      <Link
        className="block overflow-hidden rounded-xl border border-zinc-200 bg-white transition-shadow hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
        href={`/listings/${listing.id}`}
      >
        <span className="flex max-sm:flex-row flex-col sm:flex-col">
          <span className="relative aspect-[5/4] w-full shrink-0 bg-zinc-100 max-sm:order-2 max-sm:aspect-square max-sm:w-[38%] max-sm:min-w-0 sm:order-none sm:aspect-[3/2] dark:bg-zinc-900">
            {thumb ? (
              <Image
                alt=""
                className="object-cover"
                fill
                sizes="(max-width: 639px) 38vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                src={thumb}
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                {t("noImage")}
              </div>
            )}
          </span>
          <span
            className={`flex min-w-0 flex-1 flex-col gap-0.5 p-2.5 text-start max-sm:order-1 sm:order-none sm:p-3${favorite ? " max-sm:pr-11" : ""}`}
          >
            <span className="text-base font-bold tabular-nums text-zinc-900 sm:hidden dark:text-zinc-50">
              {priceFmt} {listing.price_unit}
            </span>
            <span className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
              {listing.title}
            </span>
            <span className="text-[11px] leading-relaxed text-zinc-500 sm:text-xs dark:text-zinc-400">
              {labelForCategorySlug(listing.category, categoryLabelMap)} · {typeLabels[listing.type]} ·{" "}
              {conditionLabels[listing.condition]}
            </span>
            {listing.location ? (
              <span className="line-clamp-1 text-[11px] text-zinc-500 sm:text-xs dark:text-zinc-400">
                {listing.location}
              </span>
            ) : null}
            <span className="mt-0.5 hidden flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 sm:flex">
              <span className="text-base font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                {priceFmt} {listing.price_unit}
              </span>
              {viewsFmt !== null ? (
                <span className="text-[11px] tabular-nums text-zinc-500 sm:text-xs dark:text-zinc-400">
                  {viewsFmt} {t("views")}
                </span>
              ) : null}
            </span>
            <span className="text-[11px] tabular-nums text-zinc-500 sm:hidden dark:text-zinc-400">
              {listingRelativeAge(listing.created_at, locale)}
              {viewsFmt !== null ? (
                <span>
                  {" "}
                  · {viewsFmt} {t("views")}
                </span>
              ) : null}
            </span>
          </span>
        </span>
      </Link>
      {favorite ? (
        <div className="pointer-events-auto absolute top-2 z-10 max-sm:right-2 sm:end-2">
          <ListingFavoriteHeart
            initialFavorited={favorite.initialFavorited}
            isLoggedIn={favorite.isLoggedIn}
            listingId={listing.id}
            loginReturnTo={favorite.loginReturnTo}
            variant="card"
          />
        </div>
      ) : null}
    </div>
  );
}
