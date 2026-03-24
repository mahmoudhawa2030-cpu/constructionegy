import Link from "next/link";

import { AdminUserActions } from "@/components/admin-user-actions";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type UserType = Database["public"]["Tables"]["profiles"]["Row"]["user_type"];

const USER_TYPE_LABELS: Record<UserType, string> = {
  contractor: "مقاول",
  supplier: "مورد",
};

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, user_type, phone_number, whatsapp_number, location, is_admin, is_banned, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        تعذر تحميل المستخدمين: {error.message}
      </p>
    );
  }

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

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        البريد الإلكتروني غير معروض هنا لأنه مخزّن في نظام المصادقة فقط. المعرف أدناه يطابق حساب المستخدم. حذف
        الحساب يحتاج مفتاح <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
        في الخادم.
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
            {(profiles ?? []).map((row) => (
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
            ))}
          </tbody>
        </table>
      </div>

      {(profiles?.length ?? 0) === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">لا يوجد مستخدمون.</p>
      ) : null}
    </div>
  );
}
