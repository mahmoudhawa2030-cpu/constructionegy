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

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">نظرة عامة</h1>
      <div className="grid gap-4 sm:grid-cols-3">
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
        <Link
          className="group block rounded-2xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/80"
          href="/admin/users"
        >
          <p className="text-sm text-zinc-500 dark:text-zinc-400">إجمالي المستخدمين</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {totalProfiles}
          </p>
          <p className="mt-2 text-xs text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300">
            عرض الجدول
          </p>
        </Link>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link
          className="inline-flex w-fit rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          href="/admin/listings"
        >
          إدارة الإعلانات
        </Link>
        <Link
          className="inline-flex w-fit rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          href="/admin/categories"
        >
          التصنيفات
        </Link>
        <Link
          className="inline-flex w-fit rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          href="/listings/new"
        >
          إضافة إعلان
        </Link>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        إضافة إعلان من التطبيق: <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">/listings/new</code> — ليس تحت{" "}
        <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">/admin</code>.
      </p>
    </div>
  );
}
