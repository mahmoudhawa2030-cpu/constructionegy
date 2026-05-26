import { redirect } from "next/navigation";

import { MessagesInboxPanel } from "@/components/messages-inbox-panel";
import { MessagesSplitLayout } from "@/components/messages-split-layout";
import { getInboxData } from "@/lib/messages/inbox";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MessagesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/messages");
  }

  const { error, items } = await getInboxData(user.id);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-3 py-2 sm:px-4 sm:py-3">
      <div className="flex min-h-[calc(100dvh-4.5rem-env(safe-area-inset-bottom)-1rem)] flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:min-h-[calc(100dvh-4.5rem-env(safe-area-inset-bottom)-1.5rem)]">
        <MessagesSplitLayout
          sidebar={<MessagesInboxPanel userId={user.id} error={error} items={items} />}
        >
          {children}
        </MessagesSplitLayout>
      </div>
    </div>
  );
}
