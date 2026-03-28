import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminSubscriptionAddForm } from "@/components/admin-subscription-add-form";
import {
  AdminSubscriptionDeleteBtn,
  AdminSubscriptionEditForm,
} from "@/components/admin-subscription-row-actions";
import { adminUi } from "@/lib/admin-ui";
import { FEATURE_LABELS } from "@/lib/subscriptions/features";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminUserSubscriptionsPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", id)
    .maybeSingle();

  if (profileErr || !profile) {
    notFound();
  }

  const { data: subs } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", id)
    .order("created_at", { ascending: false });

  const rows = subs ?? [];
  const now = new Date();

  return (
    <div className={adminUi.page}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className={adminUi.pageTitle}>
          اشتراكات: {profile.full_name ?? id.slice(0, 8)}
        </h1>
        <div className="flex flex-wrap gap-2">
          <Link className={adminUi.linkBack} href={`/admin/users/${id}/edit`}>
            تعديل المستخدم
          </Link>
          <Link className={adminUi.linkBack} href="/admin/users">
            المستخدمون
          </Link>
        </div>
      </div>

      <div className={adminUi.widget}>
        <div className={adminUi.widgetHeader}>الاشتراكات الحالية</div>
        <div className={adminUi.widgetBodyFlush}>
          {rows.length === 0 ? (
            <p className="px-4 py-4 text-sm text-[var(--admin-text-secondary)]">
              لا يوجد اشتراكات لهذا المستخدم.
            </p>
          ) : (
            <div className={adminUi.tableWrap}>
              <table className={adminUi.table}>
                <thead>
                  <tr className={adminUi.theadRow}>
                    <th className={adminUi.th}>الميزة</th>
                    <th className={adminUi.th}>الحالة</th>
                    <th className={adminUi.th}>صالح حتى</th>
                    <th className={adminUi.th}>تاريخ الإضافة</th>
                    <th className={adminUi.th}>تعديل / حذف</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const expires = row.valid_until ? new Date(row.valid_until) : null;
                    const active = expires === null || expires > now;
                    return (
                      <tr key={row.id} className={adminUi.tbodyRow}>
                        <td className={`${adminUi.td} whitespace-nowrap font-semibold`}>
                          {FEATURE_LABELS[row.feature].ar}
                        </td>
                        <td className={`${adminUi.td} whitespace-nowrap`}>
                          {active ? (
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
                        <td className={`${adminUi.td} min-w-[28rem]`}>
                          <div className="flex flex-wrap items-start gap-3">
                            <AdminSubscriptionEditForm
                              id={row.id}
                              userId={id}
                              validUntil={row.valid_until}
                              notes={row.notes}
                            />
                            <AdminSubscriptionDeleteBtn id={row.id} userId={id} />
                          </div>
                          {row.notes ? (
                            <p className="mt-1 text-xs text-[var(--admin-text-secondary)]">
                              ملاحظة: {row.notes}
                            </p>
                          ) : null}
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

      <div className={adminUi.widget}>
        <div className={adminUi.widgetHeader}>إضافة اشتراك جديد</div>
        <div className={adminUi.widgetBody}>
          <AdminSubscriptionAddForm userId={id} />
        </div>
      </div>
    </div>
  );
}
