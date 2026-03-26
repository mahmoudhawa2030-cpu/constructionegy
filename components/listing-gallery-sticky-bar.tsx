"use client";

import { useRouter } from "next/navigation";

import { ListingFavoriteHeart } from "@/components/listing-favorite-heart";
import { ListingShareButton } from "@/components/listing-share-button";

type Props = {
  title: string;
  priceLine: string;
  listingId: string;
  initialFavorited: boolean;
  isLoggedIn: boolean;
  shareUrl: string;
};

function BackChevronIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

export function ListingGalleryStickyBar({
  title,
  priceLine,
  listingId,
  initialFavorited,
  isLoggedIn,
  shareUrl,
}: Props) {
  const router = useRouter();

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/gallery");
  }

  return (
    <div
      className="sticky top-0 z-30 flex w-full items-center gap-1.5 border-b border-zinc-200 bg-white/95 px-3 py-2 backdrop-blur-sm sm:hidden dark:border-zinc-800 dark:bg-zinc-950/95"
      style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
    >
      <button
        aria-label="رجوع"
        className="inline-flex shrink-0 rounded-lg p-1 text-zinc-900 transition-colors hover:bg-zinc-200/80 dark:text-zinc-100 dark:hover:bg-zinc-800/80"
        type="button"
        onClick={goBack}
      >
        <BackChevronIcon className="h-7 w-7 rtl:scale-x-[-1]" />
      </button>
      <div className="min-w-0 flex-1 text-start">
        <h1 className="line-clamp-1 text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-50">{title}</h1>
        <p className="mt-0.5 text-sm font-bold tabular-nums text-zinc-900 dark:text-zinc-50">{priceLine}</p>
      </div>
      <div className="flex shrink-0 flex-row items-center gap-1.5" dir="ltr">
        <ListingFavoriteHeart
          initialFavorited={initialFavorited}
          isLoggedIn={isLoggedIn}
          listingId={listingId}
          loginReturnTo={`/listings/${listingId}`}
          variant="card"
        />
        <ListingShareButton compact title={title} url={shareUrl} />
      </div>
    </div>
  );
}
