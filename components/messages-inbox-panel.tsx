import { MessagesInboxList } from "@/components/messages-inbox-list";
import type { InboxItem } from "@/lib/messages/inbox";

type Props = {
  error: string | null;
  items: InboxItem[];
};

export function MessagesInboxPanel({ error, items }: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-zinc-200 px-4 pb-3 pt-4 dark:border-zinc-800">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">الرسائل</h1>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">سجل المحادثات</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4 pt-2 sm:px-3">
        {error ? (
          <p className="px-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : null}
        {!error && items.length === 0 ? (
          <div className="mx-1 rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm leading-relaxed text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
            لا محادثات بعد. افتح أي إعلان واضغط «مراسلة البائع».
          </div>
        ) : null}
        {!error && items.length > 0 ? <MessagesInboxList items={items} /> : null}
      </div>
    </div>
  );
}
