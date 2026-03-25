import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ProfileListingsGrid } from "@/components/profile-listings-grid";
import { UserPresenceBadge } from "@/components/user-presence-badge";
import { getCategoryLabelMap } from "@/lib/categories/queries";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

type UserType = Database["public"]["Tables"]["profiles"]["Row"]["user_type"];

const USER_TYPE_LABELS: Record<UserType, string> = {
  contractor: "مقاول / مقاولات",
  supplier: "مورد / توريد",
};

type PageProps = { params: Promise<{ id: string }> };

export default async function PublicProfilePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/profile/${id}`)}`);
  }

  if (user.id === id) {
    redirect("/profile");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, user_type, location, avatar_url, created_at, last_seen_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !profile) {
    notFound();
  }

  const { data: listingsRaw } = await supabase
    .from("listings")
    .select("*")
    .eq("user_id", id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(48);

  const listings = listingsRaw ?? [];
  const categoryLabelMap = await getCategoryLabelMap();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <Link className="text-zinc-600 underline dark:text-zinc-400" href="/gallery">
            عرض المعرض
          </Link>
          <Link className="text-zinc-600 underline dark:text-zinc-400" href={`/users/${id}/ads`}>
            كل الإعلانات (الأحدث أولاً)
          </Link>
        </div>
        <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl dark:text-zinc-50">ملف مستخدم</h1>
      </div>

      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          {profile.avatar_url ? (
            <Image
              alt=""
              className="object-cover"
              fill
              sizes="96px"
              src={profile.avatar_url}
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-2xl font-semibold text-zinc-400">
              {profile.full_name.slice(0, 1)}
            </div>
          )}
        </div>
        <div className="w-full text-center">
          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{profile.full_name}</p>
          <div className="mt-2 flex justify-center">
            <UserPresenceBadge lastSeenAt={profile.last_seen_at} />
          </div>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {USER_TYPE_LABELS[profile.user_type]}
          </p>
          {profile.location ? (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{profile.location}</p>
          ) : null}
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
            عضو منذ {new Date(profile.created_at).toLocaleDateString("ar-EG")}
          </p>
        </div>
      </div>

      <p className="mx-auto max-w-lg text-center text-xs text-zinc-500 dark:text-zinc-400">
        للتواصل استخدم الرسائل أو بيانات الإعلان عند التوفر.
      </p>

      <ProfileListingsGrid
        categoryLabelMap={categoryLabelMap}
        empty="لا توجد إعلانات منشورة من هذا المستخدم حالياً."
        listings={listings}
        title={`إعلانات ${profile.full_name}`}
      />
    </div>
  );
}
