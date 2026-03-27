import Link from "next/link";

import { updateListingStatusFromForm } from "@/app/admin/actions";
import { adminUi } from "@/lib/admin-ui";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type ListingStatus = Database["public"]["Enums"]["listing_status"];

type ListingWithOwner = Database["public"]["Tables"]["listings"]["Row"] & {
  profiles: { full_name: string } | null;
};

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
    .select("id, title, status, price, price_unit, created_at, user_id, view_count, phone_click_count, profiles(full_name)")
    .order("created_at", { ascending: false });

  const listings = [...((listingsRaw ?? []) as ListingWithOwner[])].sort((a, b) => {
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
    <div className={adminUi.page}>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link className={adminUi.linkBack} href="/gallery">
          عرض المعرض
        </Link>
      </div>

      <div className={adminUi.widget}>
        <div className={adminUi.widgetHeader}>الإعلانات</div>
        <div className={adminUi.widgetBodyFlush}>
          <div className={adminUi.tableWrap}>
        <table className={adminUi.table}>
          <thead>
            <tr className={adminUi.theadRow}>
              <th className={adminUi.th}>العنوان</th>
              <th className={adminUi.th}>المستخدم</th>
              <th className={adminUi.th}>السعر</th>
              <th className={adminUi.th}>مشاهدات</th>
              <th className={adminUi.th}>الضغط على رقمك</th>
              <th className={adminUi.th}>الحالة</th>
              <th className={adminUi.th}>تاريخ الإنشاء</th>
            </tr>
          </thead>
          <tbody>
            {(listings ?? []).map((row) => (
              <tr key={row.id} className={adminUi.tbodyRow}>
                <td className={`${adminUi.td} align-top`}>
                  <Link
                    className="font-semibold text-[var(--admin-brand)] hover:underline"
                    href={`/listings/${row.id}`}
                  >
                    {row.title}
                  </Link>
                  <p className="mt-0.5 font-mono text-xs text-[var(--admin-text-secondary)]">
                    {row.id.slice(0, 8)}…
                  </p>
                </td>
                <td className={`${adminUi.td} align-top`}>
                  <Link
                    className="font-semibold text-[var(--admin-brand)] hover:underline"
                    href={`/profile/${row.user_id}`}
                  >
                    {row.profiles?.full_name?.trim() || "—"}
                  </Link>
                  <p className="mt-0.5 font-mono text-xs text-[var(--admin-text-secondary)]" dir="ltr" title={row.user_id}>
                    {row.user_id.slice(0, 8)}…
                  </p>
                </td>
                <td className={`${adminUi.td} align-top tabular-nums`}>
                  {Number(row.price).toLocaleString("ar-EG")} {row.price_unit}
                </td>
                <td className={`${adminUi.tdMuted} align-top tabular-nums`}>
                  {new Intl.NumberFormat("ar-EG").format(row.view_count ?? 0)}
                </td>
                <td className={`${adminUi.tdMuted} align-top tabular-nums`}>
                  {new Intl.NumberFormat("ar-EG").format(row.phone_click_count ?? 0)}
                </td>
                <td className={`${adminUi.td} align-top`}>
                  <form action={updateListingStatusFromForm} className="flex flex-wrap items-center gap-2">
                    <input name="listing_id" type="hidden" value={row.id} />
                    <select className={adminUi.select} defaultValue={row.status} name="status">
                      {(Object.keys(STATUS_LABELS) as ListingStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                    <button className={adminUi.btnPrimary} type="submit">
                      حفظ
                    </button>
                  </form>
                </td>
                <td className={`${adminUi.tdMuted} align-top`}>
                  {new Date(row.created_at).toLocaleString("ar-EG")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
          </div>
        </div>
      </div>

      {(listings?.length ?? 0) === 0 ? (
        <p className="text-sm text-[var(--admin-text-secondary)]">لا توجد إعلانات بعد.</p>
      ) : null}
    </div>
  );
}
