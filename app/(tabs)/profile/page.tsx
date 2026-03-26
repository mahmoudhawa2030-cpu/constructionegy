import Link from "next/link";

import { ProfileEditForm } from "@/components/profile-edit-form";
import { ProfileListingsGrid } from "@/components/profile-listings-grid";
import { getCurrentProfile } from "@/lib/auth/admin";
import { getCategoryLabelMap } from "@/lib/categories/queries";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

type ProfileFields = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "full_name" | "user_type" | "phone_number" | "whatsapp_number" | "location" | "avatar_url"
>;

function defaultProfileFromUser(email: string | undefined): ProfileFields {
  const local = email?.split("@")[0]?.trim();
  return {
    full_name: local && local.length >= 2 ? local : "مستخدم",
    user_type: "contractor",
    phone_number: null,
    whatsapp_number: null,
    location: null,
    avatar_url: null,
  };
}

export default async function ProfilePage() {
  const { user, profile } = await getCurrentProfile();

  const supabase = await createClient();
  const { data: myListingsRaw } = user
    ? await supabase
        .from("listings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(48)
    : { data: null };

  const myListings = myListingsRaw ?? [];
  const categoryLabelMap = await getCategoryLabelMap();

  const formProfile: ProfileFields = profile
    ? {
        full_name: profile.full_name,
        user_type: profile.user_type,
        phone_number: profile.phone_number,
        whatsapp_number: profile.whatsapp_number,
        location: profile.location,
        avatar_url: profile.avatar_url,
      }
    : defaultProfileFromUser(user?.email ?? undefined);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl dark:text-zinc-50">حسابي</h1>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {user
            ? "الملف الشخصي والإعدادات السريعة."
            : "الإعدادات والملف الشخصي — سجّل الدخول للمزيد."}
        </p>
        {user?.email ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-500" dir="ltr">
            {user.email}
          </p>
        ) : null}
      </div>

      {user ? (
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          مرحباً،{" "}
          <span className="text-zinc-950 dark:text-zinc-50">{formProfile.full_name}</span>
        </p>
      ) : null}

      {user && !profile ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          لم يُعثر على سجل ملف شخصي. املأ الحقول أدناه ثم احفظ لإنشاء الملف.
        </p>
      ) : null}

      <div className="flex w-full flex-col gap-2">
        {!user ? (
          <Link
            className="inline-flex w-full justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            href="/login"
          >
            تسجيل الدخول
          </Link>
        ) : null}
        {user ? (
          <ProfileEditForm key={profile?.id ?? "new"} profile={formProfile} />
        ) : null}
        {user ? (
          <Link
            className="inline-flex w-full justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            href="/messages"
          >
            الرسائل
          </Link>
        ) : null}
        {user ? (
          <Link
            className="inline-flex w-full justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            href="/users/myads"
          >
            جميع إعلاناتي
          </Link>
        ) : null}
        {user ? (
          <Link
            className="inline-flex w-full justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            href="/listings/new"
          >
            إضافة إعلان
          </Link>
        ) : (
          <Link
            className="inline-flex w-full justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            href="/login?next=/listings/new"
          >
            إضافة إعلان (تسجيل الدخول)
          </Link>
        )}
        {profile?.is_admin ? (
          <Link
            className="inline-flex w-full justify-center rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-sm font-medium text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
            href="/admin"
          >
            لوحة الإدارة
          </Link>
        ) : null}
      </div>
      </div>

      {user ? (
        <ProfileListingsGrid
          categoryLabelMap={categoryLabelMap}
          viewerUserId={user.id}
          empty={
            <>
              لا إعلانات بعد.{" "}
              <Link className="font-medium text-zinc-900 underline dark:text-zinc-100" href="/listings/new">
                أضف إعلاناً
              </Link>
            </>
          }
          listings={myListings}
          title="إعلاناتي"
        />
      ) : null}
    </div>
  );
}
