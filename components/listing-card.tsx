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

function isRecent(iso: string, days: number): boolean {
  return Date.now() - new Date(iso).getTime() < days * 24 * 3600 * 1000;
}

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

  const isNew = isRecent(listing.created_at, 7);

  return (
    <div className="relative">
      <Link
        className="block overflow-hidden rounded-2xl border border-bina-border bg-bina-card transition-shadow hover:shadow-md hover:shadow-bina-or/10"
        href={`/listings/${listing.id}`}
      >
        <span className="relative block aspect-[5/4] w-full overflow-hidden bg-bina-steel3">
          {thumb ? (
            <Image
              alt=""
              className="object-cover"
              fill
              sizes="(max-width: 639px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
              src={thumb}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-bina-muted">
              {t("noImage")}
            </div>
          )}
          {/* Status badge */}
          {isNew ? (
            <span className="absolute left-2 top-2 rounded-md bg-[#E8F5E9] px-1.5 py-0.5 text-[10px] font-bold text-[#1B5E20]">
              New
            </span>
          ) : listing.condition === "used" ? (
            <span className="absolute left-2 top-2 rounded-md bg-[#FFF8E1] px-1.5 py-0.5 text-[10px] font-bold text-[#E65100]">
              {conditionLabels.used}
            </span>
          ) : null}
        </span>
        <span className="flex min-w-0 flex-col gap-1 p-2.5 text-start">
          <span className="line-clamp-2 min-h-[34px] text-[12px] font-medium leading-snug text-bina-text">
            {listing.title}
          </span>
          <span className="font-bina-display text-[15px] font-bold tabular-nums text-[var(--bina-primary)]">
            {priceFmt} <span className="text-[11px] font-normal text-bina-muted">{listing.price_unit}</span>
          </span>
          <span className="line-clamp-1 text-[11px] text-bina-muted">
            {labelForCategorySlug(listing.category, categoryLabelMap)} · {typeLabels[listing.type]}
          </span>
          {listing.location ? (
            <span className="line-clamp-1 text-[11px] text-bina-muted">{listing.location}</span>
          ) : null}
          <span className="mt-1 flex items-center justify-between border-t border-bina-border/60 pt-1.5 text-[10px] tabular-nums text-bina-muted">
            <span>{listingRelativeAge(listing.created_at, locale)}</span>
            {viewsFmt !== null ? (
              <span>
                {viewsFmt} {t("views")}
              </span>
            ) : null}
          </span>
        </span>
      </Link>
      {favorite ? (
        <div className="pointer-events-auto absolute top-2 z-10 end-2">
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
