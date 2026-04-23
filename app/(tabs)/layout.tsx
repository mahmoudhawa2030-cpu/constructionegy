import { redirect } from "next/navigation";

import { TabsChrome } from "@/components/tabs-chrome";
import { getUnreadIncomingTotal } from "@/lib/messages/unread";
import { createClient } from "@/lib/supabase/server";

export default async function TabsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const [{ data: profile }, unreadMsg, unreadNotif] = await Promise.all([
      supabase.from("profiles").select("is_banned").eq("id", user.id).maybeSingle(),
      getUnreadIncomingTotal(user.id),
      (supabase
        .from("comment_notifications" as never)
        .select("*", { count: "exact", head: true })
        .eq("recipient_user_id", user.id)
        .eq("read", false) as unknown as Promise<{ count: number | null }>)
        .then((r) => r.count ?? 0)
        .catch(() => 0),
    ]);

    if (profile?.is_banned) {
      redirect("/account-suspended");
    }

    return (
      <TabsChrome
        hasUser
        userId={user.id}
        initialUnreadMessageCount={unreadMsg}
        initialUnreadCommentNotifCount={unreadNotif}
      >
        {children}
      </TabsChrome>
    );
  }

  return (
    <TabsChrome
      hasUser={false}
      userId={null}
      initialUnreadMessageCount={0}
      initialUnreadCommentNotifCount={0}
    >
      {children}
    </TabsChrome>
  );
}
