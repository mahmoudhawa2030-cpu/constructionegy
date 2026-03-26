import Link from "next/link";
import { notFound } from "next/navigation";

import { UserAdsCompactCard } from "@/components/user-ads-compact-card";
import { getCategoryLabelMap } from "@/lib/categories/queries";
import { createClient } from "@/lib/supabase/server";

type Props = { profileUserId: string };

export async function UserAdsList({ profileUserId }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = Boolean(user?.id === profileUserId);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", profileUserId)
    .maybeSingle();

  let q = supabase
    .from("listings")
    .select("*")
    .eq("user_id", profileUserId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (!isOwner) {
    q = q.eq("status", "active");
  }

  const { data: listingsRaw, error: listingsError } = await q;
  if (listingsError) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-3 px-4 py-6">
        <p className="text-sm text-red-600 dark:text-red-400">تعذر تحميل الإعلانات: {listingsError.message}</p>
      </div>
    );
  }

  const listings = listingsRaw ?? [];

  if (user && !profile && listings.length === 0) {
    notFound();
  }

  const categoryLabelMap = await getCategoryLabelMap();
  const displayName = profile?.full_name?.trim() || "مستخدم";
  const title = isOwner ? "إعلاناتي" : `إعلانات ${displayName}`;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-3 py-5 sm:px-4 sm:py-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <Link className="text-zinc-600 underline dark:text-zinc-400" href="/gallery">
            المعرض
          </Link>
          {user && profileUserId !== user.id ? (
            <Link className="text-zinc-600 underline dark:text-zinc-400" href={`/profile/${profileUserId}`}>
              الملف الشخصي
            </Link>
          ) : null}
          {isOwner ? (
            <Link className="text-zinc-600 underline dark:text-zinc-400" href="/profile">
              حسابي
            </Link>
          ) : null}
        </div>
        <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl dark:text-zinc-50">{title}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          مرتبة حسب الأحدث أولاً
          {!isOwner ? " (الإعلانات المعتمدة فقط)" : ""}
        </p>
      </div>

      {listings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/80 px-4 py-10 text-center text-sm text-zinc-500 dark:border-zinc-600 dark:bg-zinc-900/30 dark:text-zinc-400">
          {isOwner ? (
            <>
              لا إعلانات بعد.{" "}
              <Link className="font-medium text-zinc-900 underline dark:text-zinc-100" href="/listings/new">
                أضف إعلاناً
              </Link>
            </>
          ) : (
            "لا توجد إعلانات منشورة من هذا المستخدم حالياً."
          )}
        </div>
      ) : (
        <ul className="flex max-w-lg flex-col gap-3 sm:max-w-none">
          {listings.map((row) => (
            <li key={row.id}>
              <UserAdsCompactCard categoryLabelMap={categoryLabelMap} isOwner={isOwner} listing={row} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
