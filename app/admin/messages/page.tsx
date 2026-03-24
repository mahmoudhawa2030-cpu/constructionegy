import Link from "next/link";

import { ADMIN_CHATS_PAGE_SIZE, getAdminChatsPage } from "@/lib/admin/moderation-queries";
import { requireAdmin } from "@/lib/auth/admin";

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
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">مراقبة المحادثات</h1>
        <Link
          className="text-sm text-zinc-600 underline dark:text-zinc-400"
          href="/admin"
        >
          العودة للنظرة العامة
        </Link>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
        <strong>مراقبة المحتوى:</strong> عرض الرسائل لاكتشاف الإساءة أو سوء السلوك. استخدم هذه الأداة وفق سياسة
        المنصة والقوانين المعمول بها. المحتوى حساس — لا تشارك لقطات خارج نطاق العمل.
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        إجمالي المحادثات:{" "}
        <span className="font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">{total}</span>
        {" · "}
        الصفحة {page} من {totalPages}
      </p>

      <div
        className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      >
        <table className="w-full min-w-max text-right text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-700">
              <th className="whitespace-nowrap px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">
                الإعلان
              </th>
              <th className="whitespace-nowrap px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">
                المشارك ١
              </th>
              <th className="whitespace-nowrap px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">
                المشارك ٢
              </th>
              <th className="min-w-[12rem] px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">
                آخر رسالة
              </th>
              <th className="whitespace-nowrap px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">
                بدأت
              </th>
              <th className="whitespace-nowrap px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">
                فتح
              </th>
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
                <tr
                  key={c.id}
                  className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                >
                  <td className="max-w-[14rem] truncate px-3 py-2 align-middle text-zinc-800 dark:text-zinc-200">
                    {listingTitle(c.listings)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 align-middle text-zinc-700 dark:text-zinc-300">
                    {n1}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 align-middle text-zinc-700 dark:text-zinc-300">
                    {n2}
                  </td>
                  <td className="max-w-[20rem] px-3 py-2 align-middle text-zinc-600 dark:text-zinc-400">
                    {previewShort}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 align-middle text-zinc-500 dark:text-zinc-500">
                    {new Date(c.created_at).toLocaleString("ar-EG")}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 align-middle">
                    <Link
                      className="font-medium text-zinc-900 underline underline-offset-2 hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-200"
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

      {chats.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">لا توجد محادثات بعد.</p>
      ) : null}

      {totalPages > 1 ? (
        <nav aria-label="Pagination" className="flex flex-wrap items-center gap-2 text-sm">
          {page > 1 ? (
            <Link
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              href={page === 2 ? "/admin/messages" : `/admin/messages?page=${page - 1}`}
            >
              السابق
            </Link>
          ) : null}
          {page < totalPages ? (
            <Link
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              href={`/admin/messages?page=${page + 1}`}
            >
              التالي
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}

export const dynamic = "force-dynamic";
