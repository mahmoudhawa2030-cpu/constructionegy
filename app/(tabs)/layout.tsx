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
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_banned")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.is_banned) {
      redirect("/account-suspended");
    }
  }

  const unreadMessages = user ? await getUnreadIncomingTotal(user.id) : 0;

  let unreadCommentNotifs = 0;
  if (user) {
    try {
      const { count } = await supabase
        .from("comment_notifications" as never)
        .select("*", { count: "exact", head: true })
        .eq("recipient_user_id", user.id)
        .eq("read", false) as unknown as { count: number | null };
      unreadCommentNotifs = count ?? 0;
    } catch {
      unreadCommentNotifs = 0;
    }
  }

  return (
    <TabsChrome
      hasUser={Boolean(user)}
      userId={user?.id ?? null}
      initialUnreadMessageCount={unreadMessages}
      initialUnreadCommentNotifCount={unreadCommentNotifs}
    >
      {children}
    </TabsChrome>
  );
}
