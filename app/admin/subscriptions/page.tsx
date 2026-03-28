import Link from "next/link";

import { adminUi } from "@/lib/admin-ui";
import { FEATURE_LABELS } from "@/lib/subscriptions/features";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionsPage() {
  const supabase = await createClient();

  const { data: subs } = await supabase
    .from("subscriptions")
    .select("*, profiles(full_name)")
    .order("created_at", { ascending: false });

  const rows = subs ?? [];
  const now = new Date();

  const active = rows.filter((r) => !r.valid_until || new Date(r.valid_until) > now);
  const expired = rows.filter((r) => r.valid_until && new Date(r.valid_until) <= now);

  return (
    <div className={adminUi.page}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className={adminUi.pageTitle}>الاشتراكات</h1>
        <Link className={adminUi.linkBack} href="/admin">
          العودة للنظرة العامة
        </Link>
      </div>

      <div className={adminUi.kpiGrid}>
        <div className={adminUi.kpiNeutral}>
          <p className={adminUi.kpiLabel}>إجمالي الاشتراكات</p>
          <p className={adminUi.kpiValue}>{rows.length}</p>
        </div>
        <div className={adminUi.kpiAccent}>
          <p className={adminUi.kpiLabel}>اشتراكات نشطة</p>
          <p className={adminUi.kpiValue}>{active.length}</p>
        </div>
        <div className={adminUi.kpiNeutral}>
          <p className={adminUi.kpiLabel}>اشتراكات منتهية</p>
          <p className={adminUi.kpiValue}>{expired.length}</p>
        </div>
      </div>

      <div className={adminUi.widget}>
        <div className={adminUi.widgetHeader}>جميع الاشتراكات</div>
        <div className={adminUi.widgetBodyFlush}>
          {rows.length === 0 ? (
            <p className="px-4 py-4 text-sm text-[var(--admin-text-secondary)]">
              لا توجد اشتراكات بعد. ابدأ بفتح مستخدم وإضافة اشتراك له.
            </p>
          ) : (
            <div className={adminUi.tableWrap}>
              <table className={adminUi.table}>
                <thead>
                  <tr className={adminUi.theadRow}>
                    <th className={adminUi.th}>المستخدم</th>
                    <th className={adminUi.th}>الميزة</th>
                    <th className={adminUi.th}>الحالة</th>
                    <th className={adminUi.th}>صالح حتى</th>
                    <th className={adminUi.th}>تاريخ الإضافة</th>
                    <th className={adminUi.th}>ملاحظات</th>
                    <th className={adminUi.th}>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const expires = row.valid_until ? new Date(row.valid_until) : null;
                    const isActive = expires === null || expires > now;
                    const profile = row.profiles as { full_name: string | null } | null;
                    return (
                      <tr key={row.id} className={adminUi.tbodyRow}>
                        <td className={`${adminUi.td} whitespace-nowrap`}>
                          <Link
                            className="font-semibold text-[var(--admin-brand)] hover:underline"
                            href={`/admin/users/${row.user_id}/subscriptions`}
                          >
                            {profile?.full_name ?? row.user_id.slice(0, 8)}
                          </Link>
                        </td>
                        <td className={`${adminUi.td} whitespace-nowrap`}>
                          {FEATURE_LABELS[row.feature].ar}
                        </td>
                        <td className={`${adminUi.td} whitespace-nowrap`}>
                          {isActive ? (
                            <span className="rounded-sm bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100">
                              نشط
                            </span>
                          ) : (
                            <span className="rounded-sm bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                              منتهي
                            </span>
                          )}
                        </td>
                        <td className={`${adminUi.tdMuted} whitespace-nowrap`}>
                          {expires ? expires.toLocaleDateString("ar-EG") : "لا ينتهي"}
                        </td>
                        <td className={`${adminUi.tdMuted} whitespace-nowrap`}>
                          {new Date(row.created_at).toLocaleDateString("ar-EG")}
                        </td>
                        <td className={`${adminUi.tdMuted} max-w-[14rem] truncate`} title={row.notes ?? ""}>
                          {row.notes ?? "—"}
                        </td>
                        <td className={`${adminUi.td} whitespace-nowrap`}>
                          <Link
                            className={adminUi.linkEmphasized}
                            href={`/admin/users/${row.user_id}/subscriptions`}
                          >
                            إدارة
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <p className={adminUi.footnote}>
        لإضافة اشتراك: ابحث عن المستخدم في{" "}
        <Link className="underline" href="/admin/users">
          جدول المستخدمين
        </Link>{" "}
        → اضغط اسمه → «الاشتراكات». أو اضغط «إدارة» في الجدول أعلاه.
      </p>
    </div>
  );
}
