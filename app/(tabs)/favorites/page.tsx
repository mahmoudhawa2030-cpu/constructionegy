import Link from "next/link";
import { redirect } from "next/navigation";

import { ListingCard } from "@/components/listing-card";
import { getCategoryLabelMap } from "@/lib/categories/queries";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type ListingRow = Database["public"]["Tables"]["listings"]["Row"];

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/favorites")}`);
  }

  const { data: rows, error } = await supabase
    .from("listing_favorites")
    .select("created_at, listings(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const categoryLabelMap = await getCategoryLabelMap();

  if (error) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-3 px-4 py-6">
        <p className="text-sm text-red-600 dark:text-red-400">تعذر تحميل المفضلة: {error.message}</p>
        <p className="text-xs text-zinc-500">
          إذا ظهر خطأ عن الجدول: نفّذ ترحيل قاعدة البيانات `listing_favorites` من مجلد supabase/migrations.
        </p>
      </div>
    );
  }

  const listings: ListingRow[] =
    rows
      ?.map((r) => {
        const L = r.listings;
        if (L && typeof L === "object" && !Array.isArray(L) && "id" in L) {
          return L as ListingRow;
        }
        return null;
      })
      .filter((x): x is ListingRow => x != null) ?? [];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-3 py-5 sm:px-4 sm:py-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl dark:text-zinc-50">المفضلة</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">إعلانات حفظتها للمراجعة لاحقاً.</p>
      </div>

      <Link className="w-fit text-sm text-zinc-600 underline dark:text-zinc-400" href="/gallery">
        تصفح المعرض
      </Link>

      {listings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/80 px-4 py-10 text-center text-sm text-zinc-500 dark:border-zinc-600 dark:bg-zinc-900/30 dark:text-zinc-400">
          لا توجد عناصر في المفضلة بعد.{" "}
          <Link className="font-medium text-zinc-900 underline dark:text-zinc-100" href="/gallery">
            تصفح الإعلانات
          </Link>{" "}
          واضغط القلب الأحمر على صفحة الإعلان.
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3 md:grid-cols-3 lg:gap-4 xl:grid-cols-4">
          {listings.map((row) => (
            <li key={row.id}>
              <ListingCard categoryLabelMap={categoryLabelMap} listing={row} showViewCount />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
