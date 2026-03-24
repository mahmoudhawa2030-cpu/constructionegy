import Image from "next/image";
import Link from "next/link";

import { labelForCategorySlug } from "@/lib/listings/categories";
import type { Database } from "@/lib/supabase/database.types";

type ListingRow = Database["public"]["Tables"]["listings"]["Row"];

type Props = {
  listing: ListingRow;
  categoryLabelMap?: Record<string, string>;
  /** When true, show view count from `view_count` (defaults false). */
  showViewCount?: boolean;
};

const typeLabels: Record<ListingRow["type"], string> = {
  rent: "إيجار",
  sell: "بيع",
};

const conditionLabels: Record<ListingRow["condition"], string> = {
  new: "جديد",
  used: "مستعمل",
};

export function ListingCard({ listing, categoryLabelMap, showViewCount }: Props) {
  const thumb = listing.images?.[0];
  const priceFmt = new Intl.NumberFormat("ar-EG", {
    maximumFractionDigits: 0,
  }).format(Number(listing.price));
  const viewsFmt =
    showViewCount === true
      ? new Intl.NumberFormat("ar-EG").format(listing.view_count ?? 0)
      : null;

  return (
    <Link
      className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition-shadow hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      href={`/listings/${listing.id}`}
    >
      <div className="relative aspect-[5/4] w-full bg-zinc-100 sm:aspect-[3/2] dark:bg-zinc-900">
        {thumb ? (
          <Image
            alt=""
            className="object-cover"
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            src={thumb}
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-zinc-400">
            لا صورة
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-0.5 p-2.5 text-start sm:p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
          {listing.title}
        </p>
        <p className="text-[11px] leading-relaxed text-zinc-500 sm:text-xs dark:text-zinc-400">
          {labelForCategorySlug(listing.category, categoryLabelMap)} · {typeLabels[listing.type]} ·{" "}
          {conditionLabels[listing.condition]}
        </p>
        {listing.location ? (
          <p className="line-clamp-1 text-[11px] text-zinc-500 sm:text-xs dark:text-zinc-400">
            {listing.location}
          </p>
        ) : null}
        <div className="mt-0.5 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
          <p className="text-base font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
            {priceFmt} {listing.price_unit}
          </p>
          {viewsFmt !== null ? (
            <p className="text-[11px] tabular-nums text-zinc-500 sm:text-xs dark:text-zinc-400">
              {viewsFmt} مشاهدة
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
