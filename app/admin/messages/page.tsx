import Link from "next/link";

import { ADMIN_CHATS_PAGE_SIZE, getAdminChatsPage } from "@/lib/admin/moderation-queries";
import { requireAdmin } from "@/lib/auth/admin";
import { adminUi } from "@/lib/admin-ui";

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

function pageNum(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export default async function AdminModerationChatsPage({ searchParams }: PageProps) {
  await requireAdmin();
  const { page: pageRaw } = await searchParams;
  const page = pageNum(pageRaw);

  const result = await getAdminChatsPage(page);

  if (result.error) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        تعذر تحميل المحادثات: {result.error}
      </p>
    );
  }

  const { chats, total, nameById, lastByChat, listingTitle } = result;
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_CHATS_PAGE_SIZE));

  return (
    <div className={`${adminUi.page} min-w-0`}>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link className={adminUi.linkBack} href="/admin">
          العودة للنظرة العامة
        </Link>
      </div>

      <div className={adminUi.messageStripWarn}>
        <strong>مراقبة المحتوى:</strong> عرض الرسائل لاكتشاف الإساءة أو سوء السلوك. استخدم هذه الأداة وفق سياسة
        المنصة والقوانين المعمول بها. المحتوى حساس — لا تشارك لقطات خارج نطاق العمل.
      </div>

      <p className={adminUi.footnote}>
        إجمالي المحادثات:{" "}
        <span className="font-semibold tabular-nums text-[var(--admin-text)]">{total}</span>
        {" · "}
        الصفحة {page} من {totalPages}
      </p>

      <div className={adminUi.widget}>
        <div className={adminUi.widgetHeader}>مراقبة المحادثات</div>
        <div className={adminUi.widgetBodyFlush}>
          <div className={adminUi.tableWrap}>
        <table className={adminUi.table}>
          <thead>
            <tr className={adminUi.theadRow}>
              <th className={adminUi.th}>الإعلان</th>
              <th className={adminUi.th}>المشارك ١</th>
              <th className={adminUi.th}>المشارك ٢</th>
              <th className={adminUi.th}>آخر رسالة</th>
              <th className={adminUi.th}>بدأت</th>
              <th className={adminUi.th}>فتح</th>
            </tr>
          </thead>
          <tbody>
            {chats.map((c) => {
              const n1 = nameById.get(c.participant1_id) ?? "—";
              const n2 = nameById.get(c.participant2_id) ?? "—";
              const preview = lastByChat.get(c.id);
              const previewShort =
                preview && preview.length > 80 ? `${preview.slice(0, 80)}…` : (preview ?? "—");
              return (
                <tr key={c.id} className={adminUi.tbodyRow}>
                  <td className={`${adminUi.td} max-w-[14rem] truncate`}>{listingTitle(c.listings)}</td>
                  <td className={`${adminUi.td} whitespace-nowrap`}>{n1}</td>
                  <td className={`${adminUi.td} whitespace-nowrap`}>{n2}</td>
                  <td className={`${adminUi.tdMuted} max-w-[20rem]`}>{previewShort}</td>
                  <td className={`${adminUi.tdMuted} whitespace-nowrap`}>
                    {new Date(c.created_at).toLocaleString("ar-EG")}
                  </td>
                  <td className={`${adminUi.td} whitespace-nowrap`}>
                    <Link
                      className="font-semibold text-[var(--admin-brand)] hover:underline"
                      href={`/admin/messages/${c.id}`}
                    >
                      عرض
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
          </div>
        </div>
      </div>

      {chats.length === 0 ? (
        <p className="text-sm text-[var(--admin-text-secondary)]">لا توجد محادثات بعد.</p>
      ) : null}

      {totalPages > 1 ? (
        <nav aria-label="Pagination" className="flex flex-wrap items-center gap-2 text-sm">
          {page > 1 ? (
            <Link
              className={adminUi.btnSecondary}
              href={page === 2 ? "/admin/messages" : `/admin/messages?page=${page - 1}`}
            >
              السابق
            </Link>
          ) : null}
          {page < totalPages ? (
            <Link className={adminUi.btnSecondary} href={`/admin/messages?page=${page + 1}`}>
              التالي
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}

export const dynamic = "force-dynamic";
