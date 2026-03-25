import Link from "next/link";

import { updateListingStatusFromForm } from "@/app/admin/actions";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type ListingStatus = Database["public"]["Enums"]["listing_status"];

const STATUS_LABELS: Record<ListingStatus, string> = {
  pending: "قيد المراجعة",
  active: "منشور (معتمد)",
  sold: "مباع",
  rented: "مؤجر",
  paused: "متوقف (المستخدم)",
};

export default async function AdminListingsPage() {
  const supabase = await createClient();
  const { data: listingsRaw, error } = await supabase
    .from("listings")
    .select("id, title, status, price, price_unit, created_at, user_id, view_count")
    .order("created_at", { ascending: false });

  const listings = [...(listingsRaw ?? [])].sort((a, b) => {
    const pri = (s: string) => (s === "pending" ? 0 : s === "paused" ? 1 : 2);
    const c = pri(a.status) - pri(b.status);
    if (c !== 0) return c;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  if (error) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        تعذر تحميل الإعلانات: {error.message}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">الإعلانات</h1>
        <Link
          className="text-sm text-zinc-600 underline dark:text-zinc-400"
          href="/gallery"
        >
          عرض المعرض
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[36rem] text-right text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-700">
              <th className="px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">العنوان</th>
              <th className="px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">السعر</th>
              <th className="px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">مشاهدات</th>
              <th className="px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">الحالة</th>
              <th className="px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">تاريخ الإنشاء</th>
            </tr>
          </thead>
          <tbody>
            {(listings ?? []).map((row) => (
              <tr
                key={row.id}
                className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
              >
                <td className="px-3 py-2 align-top">
                  <Link
                    className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                    href={`/listings/${row.id}`}
                  >
                    {row.title}
                  </Link>
                  <p className="mt-0.5 font-mono text-xs text-zinc-500">{row.id.slice(0, 8)}…</p>
                </td>
                <td className="px-3 py-2 align-top tabular-nums text-zinc-800 dark:text-zinc-200">
                  {Number(row.price).toLocaleString("ar-EG")} {row.price_unit}
                </td>
                <td className="px-3 py-2 align-top tabular-nums text-zinc-600 dark:text-zinc-400">
                  {new Intl.NumberFormat("ar-EG").format(row.view_count ?? 0)}
                </td>
                <td className="px-3 py-2 align-top">
                  <form action={updateListingStatusFromForm} className="flex flex-wrap items-center gap-2">
                    <input name="listing_id" type="hidden" value={row.id} />
                    <select
                      className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs dark:border-zinc-600 dark:bg-zinc-950"
                      defaultValue={row.status}
                      name="status"
                    >
                      {(Object.keys(STATUS_LABELS) as ListingStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                    <button
                      className="rounded-lg bg-zinc-900 px-2 py-1.5 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                      type="submit"
                    >
                      حفظ
                    </button>
                  </form>
                </td>
                <td className="px-3 py-2 align-top text-zinc-600 dark:text-zinc-400">
                  {new Date(row.created_at).toLocaleString("ar-EG")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(listings?.length ?? 0) === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">لا توجد إعلانات بعد.</p>
      ) : null}
    </div>
  );
}
