import Image from "next/image";
import Link from "next/link";

import { UserAdsListingActions } from "@/components/user-ads-listing-actions";
import { labelForCategorySlug } from "@/lib/listings/categories";
import type { Database } from "@/lib/supabase/database.types";

type ListingRow = Database["public"]["Tables"]["listings"]["Row"];
type ListingStatus = ListingRow["status"];

const STATUS_BADGE: Record<ListingStatus, { className: string; label: string }> = {
  pending: {
    className: "bg-amber-400/90 text-zinc-900",
    label: "قيد المراجعة",
  },
  active: {
    className: "bg-emerald-400 text-zinc-900",
    label: "نشط",
  },
  sold: {
    className: "bg-zinc-200 text-zinc-800 dark:bg-zinc-600 dark:text-zinc-100",
    label: "مباع",
  },
  rented: {
    className: "bg-zinc-200 text-zinc-800 dark:bg-zinc-600 dark:text-zinc-100",
    label: "مؤجر",
  },
  paused: {
    className: "bg-sky-200 text-sky-950 dark:bg-sky-800 dark:text-sky-100",
    label: "متوقف مؤقتاً",
  },
};

function formatShortDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("ar-EG", {
      day: "numeric",
      month: "short",
    }).format(d);
  } catch {
    return "—";
  }
}

/** Visual-only end date for “active period” line (no expiry field in DB). */
function displayEndDate(iso: string): string {
  try {
    const start = new Date(iso);
    if (Number.isNaN(start.getTime())) return "—";
    const end = new Date(start);
    end.setDate(end.getDate() + 30);
    return new Intl.DateTimeFormat("ar-EG", {
      day: "numeric",
      month: "short",
    }).format(end);
  } catch {
    return "—";
  }
}

function IconEye({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconPhone({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
      />
    </svg>
  );
}

function IconDotsV({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
  );
}

type Props = {
  listing: ListingRow;
  categoryLabelMap: Record<string, string>;
  isOwner: boolean;
};

/**
 * Compact “My ads” row-style card (layout only; reference-style horizontal thumbnail).
 */
export function UserAdsCompactCard({ listing, categoryLabelMap, isOwner }: Props) {
  const thumb = listing.images?.[0];
  const priceFmt = new Intl.NumberFormat("ar-EG", {
    maximumFractionDigits: 0,
  }).format(Number(listing.price));
  const viewsFmt = new Intl.NumberFormat("ar-EG").format(listing.view_count ?? 0);
  const phoneClicksFmt = new Intl.NumberFormat("ar-EG").format(listing.phone_click_count ?? 0);
  const categoryLabel = labelForCategorySlug(listing.category, categoryLabelMap);
  const badge = STATUS_BADGE[listing.status];
  const from = formatShortDate(listing.created_at);
  const to = displayEndDate(listing.created_at);

  return (
    <article
      className="overflow-hidden rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
      dir="rtl"
    >
      <div className="flex gap-3 p-3">
        {/* Thumbnail — small square (reference: icon-sized image) */}
        <Link
          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900"
          href={`/listings/${listing.id}`}
          prefetch={false}
        >
          {thumb ? (
            <Image alt="" className="object-cover" fill sizes="64px" src={thumb} />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-zinc-400 dark:text-zinc-500">
              لا صورة
            </div>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <Link className="block" href={`/listings/${listing.id}`} prefetch={false}>
                <h2 className="line-clamp-2 text-sm font-bold leading-snug text-zinc-900 dark:text-zinc-50">
                  {listing.title}
                </h2>
              </Link>
              <p className="mt-0.5 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {priceFmt} {listing.price_unit}
              </p>
              <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">{categoryLabel}</p>
            </div>
            {isOwner ? (
              <span
                className="shrink-0 rounded-lg p-1 text-zinc-400 dark:text-zinc-500"
                title="قريباً"
                aria-hidden
              >
                <IconDotsV className="h-5 w-5" />
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-200 px-3 pb-3 pt-2 dark:border-zinc-800">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          نشط من {from} إلى {to}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {isOwner ? (
            <span className="inline-flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-300">
              <IconEye className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
              {viewsFmt} مشاهدة
            </span>
          ) : null}
          {isOwner ? (
            <span className="inline-flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-300">
              <IconPhone className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
              <span>
                الضغط على رقمك: <span className="tabular-nums font-medium">{phoneClicksFmt}</span>
              </span>
            </span>
          ) : null}
          <span
            className={`ms-auto rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>

        {isOwner ? (
          <div className="mt-3 sm:flex sm:w-full sm:justify-start sm:[direction:ltr]">
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-fit sm:origin-left sm:scale-[0.8] sm:gap-4">
              <Link
                className="flex items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 text-center text-sm font-medium text-zinc-900 transition-colors hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 sm:min-w-[13rem] sm:py-4 sm:text-base sm:rounded-2xl"
                href={`/listings/${listing.id}/edit`}
                prefetch={false}
              >
                تعديل
              </Link>
              <span
                className="flex cursor-default items-center justify-center rounded-xl bg-red-500 py-2.5 text-center text-sm font-semibold text-white opacity-90 sm:min-w-[13rem] sm:py-4 sm:text-base sm:rounded-2xl"
                title="واجهة فقط"
              >
                عرّض أسرع
              </span>
            </div>
          </div>
        ) : null}
        {isOwner ? <UserAdsListingActions listing={listing} /> : null}
      </div>
    </article>
  );
}
