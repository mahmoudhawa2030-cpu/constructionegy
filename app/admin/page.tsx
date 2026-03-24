import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [listingsCount, pendingCount, profilesCount] = await Promise.all([
    supabase.from("listings").select("id", { count: "exact", head: true }),
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  const totalListings = listingsCount.count ?? 0;
  const pendingListings = pendingCount.count ?? 0;
  const totalProfiles = profilesCount.count ?? 0;

  const linkRowClass =
    "block w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 transition-colors hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/80";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">نظرة عامة</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/40">
            <p className="text-sm text-amber-800 dark:text-amber-200">بانتظار الموافقة</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-amber-950 dark:text-amber-50">
              {pendingListings}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">إجمالي الإعلانات</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {totalListings}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">إجمالي المستخدمين</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {totalProfiles}
            </p>
          </div>
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">أقسام الإدارة</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">عمليات المستخدمين</h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                إدارة الحسابات، مراقبة المحادثات، وما سيُضاف لاحقًا من أدوات تتعلق بالمستخدمين.
              </p>
            </div>
            <ul className="flex flex-col gap-2">
              <li>
                <Link className={linkRowClass} href="/admin/users">
                  جدول المستخدمين
                </Link>
              </li>
              <li>
                <Link className={linkRowClass} href="/admin/messages">
                  مراقبة المحادثات
                </Link>
              </li>
              <li>
                <div
                  className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950/50 dark:text-zinc-500"
                  role="status"
                >
                  عمليات مستقبلية (قريبًا)
                </div>
              </li>
            </ul>
          </div>

          <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">الإعلانات والمحتوى</h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                الموافقة على الإعلانات، التصنيفات، وإضافة إعلانات جديدة.
              </p>
            </div>
            <ul className="flex flex-col gap-2">
              <li>
                <Link className={linkRowClass} href="/admin/listings">
                  إدارة الإعلانات
                </Link>
              </li>
              <li>
                <Link className={linkRowClass} href="/admin/categories">
                  التصنيفات
                </Link>
              </li>
              <li>
                <Link className={linkRowClass} href="/listings/new">
                  إضافة إعلان
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          إضافة إعلان من التطبيق: <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">/listings/new</code> — ليس تحت{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">/admin</code>.
        </p>
      </section>
    </div>
  );
}
