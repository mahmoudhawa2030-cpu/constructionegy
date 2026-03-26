import Link from "next/link";

import { CreateCategoryForm, DeleteCategoryForm, EditCategoryForm } from "@/components/admin-category-forms";
import { getAllCategoriesForAdmin } from "@/lib/categories/admin-queries";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const rows = await getAllCategoriesForAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">التصنيفات</h1>
        <Link
          className="text-sm text-zinc-600 underline dark:text-zinc-400"
          href="/admin"
        >
          العودة للنظرة العامة
        </Link>
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        المعرف (slug) يُخزَّن في الإعلانات؛ تغييره يحدّث الإعلانات تلقائياً. لا يمكن حذف تصنيف ما دامت
        إعلانات تستخدمه.
      </p>

      <CreateCategoryForm />

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        كل صف: عدد الإعلانات · المعرف (لاتيني) · الاسم بالعربية · الترتيب · مفعّل · حفظ — ثم حذف.
      </p>
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/80">
              <th className="px-3 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400">عدد الإعلانات</th>
              <th className="px-3 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400">التصنيف</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-zinc-100 align-middle last:border-0 dark:border-zinc-800">
                <td className="whitespace-nowrap px-3 py-2 text-center tabular-nums text-zinc-900 dark:text-zinc-100">
                  {new Intl.NumberFormat("ar-EG").format(row.listing_count)}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-nowrap items-start gap-3">
                    <EditCategoryForm row={row} />
                    <DeleteCategoryForm id={row.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">لا توجد تصنيفات.</p>
      ) : null}
    </div>
  );
}
