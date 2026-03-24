import Link from "next/link";
import { Suspense } from "react";

import { AdminUsersPresenceFilter } from "@/components/admin-users-presence-filter";
import { AdminUserActions } from "@/components/admin-user-actions";
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

type PageProps = {
  searchParams: Promise<{ presence?: string }>;
};

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const { presence: presenceRaw } = await searchParams;
  const presence = parsePresenceFilter(presenceRaw);

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
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">المستخدمون</h1>
        <Link
          className="text-sm text-zinc-600 underline dark:text-zinc-400"
          href="/admin"
        >
          العودة للنظرة العامة
        </Link>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <Suspense
          fallback={
            <div className="h-[4.25rem] min-w-[12rem] animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          }
        >
          <AdminUsersPresenceFilter value={presence} />
        </Suspense>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          العدد:{" "}
          <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {rows.length}
          </span>
        </p>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        البريد الإلكتروني غير معروض هنا لأنه مخزّن في نظام المصادقة فقط. المعرف أدناه يطابق حساب المستخدم. حذف
        الحساب يحتاج مفتاح <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
        في الخادم. «متصل الآن» يعتمد على نبضات التطبيق كل ~٩٠ ثانية (نفس نطاق التصفية والشارة: آخر ظهور خلال حوالي ٣–٤ دقائق).
      </p>

      <div
        className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      >
        <table className="w-full min-w-max text-right text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-700">
              <th className="whitespace-nowrap px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">
                الاسم
              </th>
              <th className="whitespace-nowrap px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">
                النوع
              </th>
              <th className="whitespace-nowrap px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">
                هاتف
              </th>
              <th className="whitespace-nowrap px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">
                الموقع
              </th>
              <th className="whitespace-nowrap px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">
                إداري
              </th>
              <th className="whitespace-nowrap px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">
                الحالة
              </th>
              <th className="whitespace-nowrap px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">
                آخر ظهور
              </th>
              <th className="whitespace-nowrap px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">
                آخر نشاط
              </th>
              <th className="whitespace-nowrap px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">
                التسجيل
              </th>
              <th className="whitespace-nowrap px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">
                المعرف
              </th>
              <th className="whitespace-nowrap px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">
                إجراءات
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const lastSeen = row.last_seen_at ? new Date(row.last_seen_at) : null;
              const lastActive = row.last_active_at ? new Date(row.last_active_at) : null;
              const online = row.last_seen_at ? isUserOnlineNow(row.last_seen_at) : false;

              return (
                <tr
                  key={row.id}
                  className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                >
                  <td className="whitespace-nowrap px-3 py-2 align-middle">
                    <Link
                      className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
                      href={`/profile/${row.id}`}
                    >
                      {row.full_name}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 align-middle text-zinc-800 dark:text-zinc-200">
                    {USER_TYPE_LABELS[row.user_type]}
                  </td>
                  <td
                    className="whitespace-nowrap px-3 py-2 align-middle tabular-nums text-zinc-600 dark:text-zinc-400"
                    dir="ltr"
                  >
                    {row.phone_number ?? "—"}
                  </td>
                  <td className="max-w-[12rem] truncate px-3 py-2 align-middle text-zinc-600 dark:text-zinc-400">
                    {row.location ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 align-middle">
                    {row.is_admin ? (
                      <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-950 dark:bg-amber-950/50 dark:text-amber-100">
                        نعم
                      </span>
                    ) : (
                      <span className="text-zinc-500 dark:text-zinc-400">لا</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 align-middle">
                    {row.is_banned ? (
                      <span className="rounded-md bg-red-100 px-2 py-0.5 text-xs font-medium text-red-950 dark:bg-red-950/40 dark:text-red-100">
                        محظور
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">نشط</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 align-middle text-zinc-600 dark:text-zinc-400">
                    {lastSeen ? (
                      <span className="inline-flex flex-wrap items-center gap-1">
                        {online ? (
                          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[11px] font-medium text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100">
                            متصل
                          </span>
                        ) : null}
                        <span>{lastSeen.toLocaleString("ar-EG")}</span>
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 align-middle text-zinc-600 dark:text-zinc-400">
                    {lastActive ? lastActive.toLocaleString("ar-EG") : "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 align-middle text-zinc-600 dark:text-zinc-400">
                    {new Date(row.created_at).toLocaleString("ar-EG")}
                  </td>
                  <td
                    className="whitespace-nowrap px-3 py-2 align-middle font-mono text-xs text-zinc-500"
                    dir="ltr"
                    title={row.id}
                  >
                    {row.id.slice(0, 8)}…
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 align-middle">
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
        <p className="text-sm text-zinc-500 dark:text-zinc-400">لا يوجد مستخدمون يطابقون التصفية.</p>
      ) : null}
    </div>
  );
}

export const dynamic = "force-dynamic";
