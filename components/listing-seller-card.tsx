import Image from "next/image";
import Link from "next/link";

import { UserPresenceBadge } from "@/components/user-presence-badge";

type Props = {
  userId: string;
  fullName: string | null;
  avatarUrl: string | null;
  /** ISO date string from profiles.created_at */
  createdAt: string | null;
  /** For online / offline dot (profiles.last_seen_at). */
  lastSeenAt: string | null;
  isOwner: boolean;
};

function memberSinceLabel(createdAt: string | null): string | null {
  if (!createdAt) return null;
  try {
    const d = new Date(createdAt);
    if (Number.isNaN(d.getTime())) return null;
    return new Intl.DateTimeFormat("ar-EG", {
      month: "long",
      year: "numeric",
    }).format(d);
  } catch {
    return null;
  }
}

export function ListingSellerCard({
  userId,
  fullName,
  avatarUrl,
  createdAt,
  lastSeenAt,
  isOwner,
}: Props) {
  const displayName =
    fullName?.trim() || (isOwner ? "حسابك" : "مستخدم");
  const initial = displayName.charAt(0).toUpperCase();
  const since = memberSinceLabel(createdAt);
  const profileHref = isOwner ? "/profile" : `/profile/${userId}`;

  return (
    <section
      aria-labelledby="listing-seller-heading"
      className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h2
        id="listing-seller-heading"
        className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50"
      >
        {isOwner ? "ناشر الإعلان" : "نُشر بواسطة"}
      </h2>
      <div className="flex gap-3">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-200 text-sm font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100">
          {avatarUrl ? (
            <Image
              alt=""
              className="object-cover"
              fill
              sizes="48px"
              src={avatarUrl}
              unoptimized
            />
          ) : (
            <span aria-hidden>{initial}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-zinc-900 dark:text-zinc-50">{displayName}</p>
          {!isOwner ? (
            <div className="mt-1">
              <UserPresenceBadge compact lastSeenAt={lastSeenAt} />
            </div>
          ) : null}
          {since ? (
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">عضو منذ {since}</p>
          ) : null}
          <div className="mt-1 flex flex-col gap-1">
            <Link
              className="text-sm font-medium text-zinc-900 underline underline-offset-2 hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-200"
              href={profileHref}
            >
              عرض الملف الشخصي
            </Link>
            <Link
              className="text-sm font-medium text-zinc-900 underline underline-offset-2 hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-200"
              href={isOwner ? "/users/myads" : `/users/${userId}/ads`}
            >
              {isOwner ? "جميع إعلاناتي" : "جميع إعلاناته"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
