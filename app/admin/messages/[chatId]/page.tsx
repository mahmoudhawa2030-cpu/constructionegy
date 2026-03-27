import Link from "next/link";
import { notFound } from "next/navigation";

import { getAdminChatThread } from "@/lib/admin/moderation-queries";
import { formatEgyptDateTime } from "@/lib/date/egypt";
import { requireAdmin } from "@/lib/auth/admin";
import { adminUi } from "@/lib/admin-ui";

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
    <div className={`${adminUi.page} min-w-0`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className={adminUi.pageTitle}>محادثة (مراقبة)</h1>
        <Link className={adminUi.linkBack} href="/admin/messages">
          ← كل المحادثات
        </Link>
      </div>

      <div className={`${adminUi.cardPadded} text-sm`}>
        <p>
          <span className="font-semibold text-[var(--admin-text)]">الإعلان:</span> {title}
        </p>
        <p className="mt-1 text-[var(--admin-text-secondary)]">
          {p1Name} ↔ {p2Name}
        </p>
        <p className="mt-1 font-mono text-xs text-[var(--admin-text-secondary)]" dir="ltr">
          {chat.id}
        </p>
      </div>

      <div className={adminUi.threadShell}>
        {messages.length === 0 ? (
          <p className="text-sm text-[var(--admin-text-secondary)]">لا يوجد رسائل في هذه المحادثة.</p>
        ) : (
          messages.map((m) => {
            const senderName = nameById.get(m.sender_id) ?? "—";
            return (
              <div key={m.id} className={adminUi.messageCard}>
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--admin-shell-border)] pb-1">
                  <span className="font-semibold text-[var(--admin-text)]">{senderName}</span>
                  <time
                    className="text-xs tabular-nums text-[var(--admin-text-secondary)]"
                    dateTime={m.created_at}
                  >
                    {formatEgyptDateTime(m.created_at)}
                  </time>
                </div>
                <p className="mt-2 whitespace-pre-wrap break-words text-[var(--admin-text)]">{m.content}</p>
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
