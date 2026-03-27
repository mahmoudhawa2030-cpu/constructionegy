import Link from "next/link";

import { adminUi } from "@/lib/admin-ui";
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
    <div className={adminUi.page}>
      <div>
        <h1 className={adminUi.pageTitle}>نظرة عامة</h1>
        <div className={adminUi.kpiGrid}>
          <Link
            className={adminUi.kpiAccent}
            href="/admin/listings"
            prefetch={true}
          >
            <p className={`${adminUi.kpiLabel} text-amber-900 dark:text-amber-200`}>بانتظار الموافقة</p>
            <p className={`${adminUi.kpiValue} text-amber-950 dark:text-amber-50`}>{pendingListings}</p>
          </Link>
          <div className={adminUi.kpiNeutral}>
            <p className={adminUi.kpiLabel}>إجمالي الإعلانات</p>
            <p className={adminUi.kpiValue}>{totalListings}</p>
          </div>
          <div className={adminUi.kpiNeutral}>
            <p className={adminUi.kpiLabel}>إجمالي المستخدمين</p>
            <p className={adminUi.kpiValue}>{totalProfiles}</p>
          </div>
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className={adminUi.sectionTitle}>أقسام الإدارة</h2>
        <div className={adminUi.gridTwo}>
          <div className={`${adminUi.cardPadded} flex flex-col`}>
            <div className="mb-4">
              <h3 className={adminUi.sectionTitle}>عمليات المستخدمين</h3>
              <p className={adminUi.sectionLead}>
                إدارة الحسابات، مراقبة المحادثات، وما سيُضاف لاحقًا من أدوات تتعلق بالمستخدمين.
              </p>
            </div>
            <ul className="flex flex-col gap-2">
              <li>
                <Link className={adminUi.objectLink} href="/admin/users">
                  جدول المستخدمين
                </Link>
              </li>
              <li>
                <Link className={adminUi.objectLink} href="/admin/messages">
                  مراقبة المحادثات
                </Link>
              </li>
              <li>
                <div className={adminUi.placeholderTile} role="status">
                  عمليات مستقبلية (قريبًا)
                </div>
              </li>
            </ul>
          </div>

          <div className={`${adminUi.cardPadded} flex flex-col`}>
            <div className="mb-4">
              <h3 className={adminUi.sectionTitle}>الإعلانات والمحتوى</h3>
              <p className={adminUi.sectionLead}>
                الموافقة على الإعلانات، التصنيفات، وإضافة إعلانات جديدة.
              </p>
            </div>
            <ul className="flex flex-col gap-2">
              <li>
                <Link className={adminUi.objectLink} href="/admin/listings">
                  إدارة الإعلانات
                </Link>
              </li>
              <li>
                <Link className={adminUi.objectLink} href="/admin/categories">
                  التصنيفات
                </Link>
              </li>
              <li>
                <Link className={adminUi.objectLink} href="/listings/new">
                  إضافة إعلان
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <p className={adminUi.footnote}>
          إضافة إعلان من التطبيق: <code className={adminUi.code}>/listings/new</code> — ليس تحت{" "}
          <code className={adminUi.code}>/admin</code>.
        </p>
      </section>
    </div>
  );
}
