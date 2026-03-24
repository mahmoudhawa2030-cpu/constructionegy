import Link from "next/link";
import { notFound } from "next/navigation";

import { getAdminChatThread } from "@/lib/admin/moderation-queries";
import { requireAdmin } from "@/lib/auth/admin";

type PageProps = {
  params: Promise<{ chatId: string }>;
};

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function AdminModerationChatThreadPage({ params }: PageProps) {
  await requireAdmin();
  const { chatId } = await params;
  if (!uuidRe.test(chatId)) {
    notFound();
  }

  const result = await getAdminChatThread(chatId);

  if (result.error || !result.chat) {
    notFound();
  }

  const { chat, messages, nameById, listingTitle } = result;
  const title = listingTitle(chat.listings);
  const p1Name = nameById.get(chat.participant1_id) ?? "—";
  const p2Name = nameById.get(chat.participant2_id) ?? "—";

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">محادثة (مراقبة)</h1>
        <Link
          className="text-sm text-zinc-600 underline dark:text-zinc-400"
          href="/admin/messages"
        >
          ← كل المحادثات
        </Link>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-zinc-700 dark:text-zinc-300">
          <span className="font-medium text-zinc-900 dark:text-zinc-50">الإعلان:</span> {title}
        </p>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          {p1Name} ↔ {p2Name}
        </p>
        <p className="mt-1 font-mono text-xs text-zinc-500" dir="ltr">
          {chat.id}
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
        {messages.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">لا يوجد رسائل في هذه المحادثة.</p>
        ) : (
          messages.map((m) => {
            const senderName = nameById.get(m.sender_id) ?? "—";
            return (
              <div
                key={m.id}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-100 pb-1 dark:border-zinc-800">
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">{senderName}</span>
                  <time
                    className="text-xs tabular-nums text-zinc-500 dark:text-zinc-500"
                    dateTime={m.created_at}
                  >
                    {new Date(m.created_at).toLocaleString("ar-EG")}
                  </time>
                </div>
                <p className="mt-2 whitespace-pre-wrap break-words text-zinc-800 dark:text-zinc-200">
                  {m.content}
                </p>
              </div>
            );
          })
        )}
      </div>

      {messages.length >= 500 ? (
        <p className="text-xs text-amber-700 dark:text-amber-300">
          عُرضت أول ٥٠٠ رسالة حسب الحد الأقصى للعرض.
        </p>
      ) : null}
    </div>
  );
}

export const dynamic = "force-dynamic";
