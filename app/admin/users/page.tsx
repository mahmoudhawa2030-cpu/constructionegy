import Link from "next/link";
import { Suspense } from "react";

import { AdminUsersPhoneSearch } from "@/components/admin-users-phone-search";
import { AdminUsersPresenceFilter } from "@/components/admin-users-presence-filter";
import { AdminUserActions } from "@/components/admin-user-actions";
import { adminUi } from "@/lib/admin-ui";
import {
  activeSinceIso,
  isUserOnlineNow,
  lastSeenOnlineSinceIso,
  parsePresenceFilter,
} from "@/lib/admin/presence-filters";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type UserType = Database["public"]["Tables"]["profiles"]["Row"]["user_type"];

const USER_TYPE_LABELS: Record<UserType, string> = {
  contractor: "مقاول",
  supplier: "مورد",
};

/** Escape `%` and `_` for PostgreSQL ILIKE pattern literals. */
function escapeIlikePattern(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

type PageProps = {
  searchParams: Promise<{ presence?: string; phone?: string }>;
};

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const { presence: presenceRaw, phone: phoneRaw } = await searchParams;
  const presence = parsePresenceFilter(presenceRaw);
  const phoneSearch = typeof phoneRaw === "string" ? phoneRaw.trim() : "";

  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("profiles")
    .select(
      "id, full_name, user_type, phone_number, whatsapp_number, location, is_admin, is_banned, created_at, last_seen_at, last_active_at",
    )
    .order("created_at", { ascending: false });

  if (presence === "online") {
    query = query.gte("last_seen_at", lastSeenOnlineSinceIso());
  } else if (presence !== "all") {
    const since = activeSinceIso(presence);
    if (since) {
      query = query.gte("last_active_at", since);
    }
  }

  if (phoneSearch) {
    const pattern = `%${escapeIlikePattern(phoneSearch)}%`;
    query = query.ilike("phone_number", pattern);
  }

  const { data: profiles, error } = await query;

  if (error) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        تعذر تحميل المستخدمين: {error.message}
      </p>
    );
  }

  const rows = profiles ?? [];

  return (
    <div className={`${adminUi.page} min-w-0`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className={adminUi.pageTitle}>المستخدمون</h1>
        <Link className={adminUi.linkBack} href="/admin">
          العودة للنظرة العامة
        </Link>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <Suspense
          fallback={
            <div className="flex flex-wrap gap-4">
              <div className="h-[4.25rem] min-w-[14rem] flex-1 animate-pulse rounded-sm bg-[var(--admin-table-header-bg)]" />
              <div className="h-[4.25rem] min-w-[12rem] animate-pulse rounded-sm bg-[var(--admin-table-header-bg)]" />
            </div>
          }
        >
          <div className="flex flex-wrap items-end gap-4">
            <AdminUsersPhoneSearch />
            <AdminUsersPresenceFilter value={presence} />
          </div>
        </Suspense>
        <p className="text-sm text-[var(--admin-text-secondary)]">
          العدد:{" "}
          <span className="font-semibold tabular-nums text-[var(--admin-text)]">{rows.length}</span>
        </p>
      </div>

      <p className={adminUi.footnote}>
        البريد الإلكتروني غير معروض هنا لأنه مخزّن في نظام المصادقة فقط. المعرف أدناه يطابق حساب المستخدم. حذف
        الحساب يحتاج مفتاح <code className={adminUi.code}>SUPABASE_SERVICE_ROLE_KEY</code> في الخادم. «متصل الآن» يعتمد
        على نبضات التطبيق كل ~٩٠ ثانية (نفس نطاق التصفية والشارة: آخر ظهور خلال حوالي ٣–٤ دقائق).
      </p>

      <div className={adminUi.tableWrap}>
        <table className={adminUi.table}>
          <thead>
            <tr className={adminUi.theadRow}>
              <th className={adminUi.th}>الاسم</th>
              <th className={adminUi.th}>النوع</th>
              <th className={adminUi.th}>هاتف</th>
              <th className={adminUi.th}>الموقع</th>
              <th className={adminUi.th}>إداري</th>
              <th className={adminUi.th}>الحالة</th>
              <th className={adminUi.th}>آخر ظهور</th>
              <th className={adminUi.th}>آخر نشاط</th>
              <th className={adminUi.th}>التسجيل</th>
              <th className={adminUi.th}>المعرف</th>
              <th className={adminUi.th}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const lastSeen = row.last_seen_at ? new Date(row.last_seen_at) : null;
              const lastActive = row.last_active_at ? new Date(row.last_active_at) : null;
              const online = row.last_seen_at ? isUserOnlineNow(row.last_seen_at) : false;

              return (
                <tr key={row.id} className={adminUi.tbodyRow}>
                  <td className={`${adminUi.td} whitespace-nowrap`}>
                    <Link
                      className="font-semibold text-[var(--admin-brand)] hover:underline"
                      href={`/profile/${row.id}`}
                    >
                      {row.full_name}
                    </Link>
                  </td>
                  <td className={`${adminUi.td} whitespace-nowrap`}>{USER_TYPE_LABELS[row.user_type]}</td>
                  <td className={`${adminUi.tdMuted} whitespace-nowrap tabular-nums`} dir="ltr">
                    {row.phone_number ?? "—"}
                  </td>
                  <td className={`${adminUi.tdMuted} max-w-[12rem] truncate`}>{row.location ?? "—"}</td>
                  <td className={`${adminUi.td} whitespace-nowrap`}>
                    {row.is_admin ? (
                      <span className="rounded-sm bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-950 dark:bg-amber-950/50 dark:text-amber-100">
                        نعم
                      </span>
                    ) : (
                      <span className="text-[var(--admin-text-secondary)]">لا</span>
                    )}
                  </td>
                  <td className={`${adminUi.td} whitespace-nowrap`}>
                    {row.is_banned ? (
                      <span className="rounded-sm bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-950 dark:bg-red-950/40 dark:text-red-100">
                        محظور
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--admin-text-secondary)]">نشط</span>
                    )}
                  </td>
                  <td className={`${adminUi.tdMuted} whitespace-nowrap`}>
                    {lastSeen ? (
                      <span className="inline-flex flex-wrap items-center gap-1">
                        {online ? (
                          <span className="rounded-sm bg-emerald-100 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100">
                            متصل
                          </span>
                        ) : null}
                        <span>{lastSeen.toLocaleString("ar-EG")}</span>
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className={`${adminUi.tdMuted} whitespace-nowrap`}>
                    {lastActive ? lastActive.toLocaleString("ar-EG") : "—"}
                  </td>
                  <td className={`${adminUi.tdMuted} whitespace-nowrap`}>
                    {new Date(row.created_at).toLocaleString("ar-EG")}
                  </td>
                  <td
                    className={`${adminUi.tdMuted} whitespace-nowrap font-mono text-xs`}
                    dir="ltr"
                    title={row.id}
                  >
                    {row.id.slice(0, 8)}…
                  </td>
                  <td className={`${adminUi.td} whitespace-nowrap`}>
                    <AdminUserActions
                      isAdmin={row.is_admin}
                      isBanned={row.is_banned}
                      isSelf={currentUser?.id === row.id}
                      userId={row.id}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-[var(--admin-text-secondary)]">
          لا يوجد مستخدمون يطابقون التصفية
          {phoneSearch ? ` (بحث الهاتف: ${phoneSearch})` : ""}.
        </p>
      ) : null}
    </div>
  );
}

export const dynamic = "force-dynamic";
