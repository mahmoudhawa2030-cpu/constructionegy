import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { MessagesInboxPanel } from "@/components/messages-inbox-panel";
import { MessagesSplitLayout } from "@/components/messages-split-layout";
import { WebHeader } from "@/components/web/web-header";
import { getActiveCategoriesForSelect } from "@/lib/categories/queries";
import { getInboxData } from "@/lib/messages/inbox";
import { getUnreadIncomingTotal } from "@/lib/messages/unread";
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

  const [{ error, items }, t, categories, unreadMsg, profileRes] = await Promise.all([
    getInboxData(user.id),
    getTranslations("messagesInbox"),
    getActiveCategoriesForSelect(),
    getUnreadIncomingTotal(user.id),
    supabase.from("profiles").select("full_name,avatar_url").eq("id", user.id).maybeSingle(),
  ]);
  const profile = profileRes.data;

  return (
    <>
      {/* Web header - desktop only */}
      <div className="hidden md:block -mx-3 sm:-mx-4">
        <WebHeader
          hasUser
          userId={user.id}
          userName={profile?.full_name ?? null}
          userAvatar={profile?.avatar_url ?? null}
          unreadMessageCount={unreadMsg}
          categories={categories}
        />
      </div>
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-3 py-2 sm:px-4 sm:py-3">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{t("title")}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("subtitle")}</p>
        </div>
        <div className="flex min-h-[calc(100dvh-4.5rem-env(safe-area-inset-bottom)-1rem-3rem)] flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:min-h-[calc(100dvh-4.5rem-env(safe-area-inset-bottom)-1.5rem-3rem)]">
          <MessagesSplitLayout
            sidebar={<MessagesInboxPanel userId={user.id} error={error} items={items} />}
          >
            {children}
          </MessagesSplitLayout>
        </div>
      </div>
    </>
  );
}
