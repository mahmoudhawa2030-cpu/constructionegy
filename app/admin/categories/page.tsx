import Link from "next/link";

import { CreateCategoryForm, DeleteCategoryForm, EditCategoryForm } from "@/components/admin-category-forms";
import { getAllCategoriesForAdmin } from "@/lib/categories/admin-queries";
import { adminUi } from "@/lib/admin-ui";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const rows = await getAllCategoriesForAdmin();

  return (
    <div className={adminUi.page}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className={adminUi.pageTitle}>التصنيفات</h1>
        <Link className={adminUi.linkBack} href="/admin">
          العودة للنظرة العامة
        </Link>
      </div>

      <p className="text-sm text-[var(--admin-text-secondary)]">
        المعرف (slug) يُخزَّن في الإعلانات؛ تغييره يحدّث الإعلانات تلقائياً. لا يمكن حذف تصنيف ما دامت إعلانات
        تستخدمه.
      </p>

      <CreateCategoryForm />

      <p className={adminUi.footnote}>
        كل صف: عدد الإعلانات · المعرف (لاتيني) · الاسم بالعربية · الترتيب · مفعّل · حفظ — ثم حذف.
      </p>
      <div className={adminUi.tableWrap}>
        <table className={`${adminUi.table} min-w-[36rem]`}>
          <thead>
            <tr className={adminUi.theadRow}>
              <th className={adminUi.th}>عدد الإعلانات</th>
              <th className={adminUi.th}>التصنيف</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={`${adminUi.tbodyRow} align-middle`}>
                <td className={`${adminUi.td} whitespace-nowrap text-center tabular-nums`}>
                  {new Intl.NumberFormat("ar-EG").format(row.listing_count)}
                </td>
                <td className={adminUi.td}>
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
        <p className="text-sm text-[var(--admin-text-secondary)]">لا توجد تصنيفات.</p>
      ) : null}
    </div>
  );
}
