"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { toggleListingFavorite } from "@/lib/favorites/actions";

type Props = {
  listingId: string;
  initialFavorited: boolean;
  isLoggedIn: boolean;
};

function HeartIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill={filled ? "currentColor" : "none"}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      />
    </svg>
  );
}

export function ListingFavoriteHeart({ listingId, initialFavorited, isLoggedIn }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [favorited, setFavorited] = useState(initialFavorited);

  useEffect(() => {
    setFavorited(initialFavorited);
  }, [initialFavorited]);

  if (!isLoggedIn) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Link
          className="inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-red-600 transition-opacity hover:opacity-80 dark:text-red-500"
          href={`/login?next=${encodeURIComponent(`/listings/${listingId}`)}`}
          title="تسجيل الدخول لإضافة للمفضلة"
        >
          <HeartIcon className="h-7 w-7" filled={false} />
          <span className="text-sm font-medium">إضافة للمفضلة</span>
        </Link>
        <Link className="text-sm font-medium text-red-600 underline underline-offset-2 dark:text-red-500" href="/favorites">
          صفحة المفضلة
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        className="inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-red-600 transition-opacity hover:opacity-80 disabled:opacity-50 dark:text-red-500"
        disabled={pending}
        type="button"
        title={favorited ? "إزالة من المفضلة" : "إضافة للمفضلة"}
        onClick={() => {
          startTransition(async () => {
            const prev = favorited;
            setFavorited(!prev);
            const r = await toggleListingFavorite(listingId);
            if (!r.ok) {
              setFavorited(prev);
              alert(r.message);
              return;
            }
            setFavorited(r.favorited);
            router.refresh();
          });
        }}
      >
        <HeartIcon className="h-7 w-7" filled={favorited} />
        <span className="text-sm font-medium">{favorited ? "في المفضلة" : "إضافة للمفضلة"}</span>
      </button>
      <Link
        className="text-sm font-medium text-red-600 underline underline-offset-2 dark:text-red-500"
        href="/favorites"
        prefetch={true}
      >
        عرض المفضلة
      </Link>
    </div>
  );
}
