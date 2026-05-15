import { redirect } from "next/navigation";

import { WebHeader } from "@/components/web/web-header";
import { WebFooter } from "@/components/web/web-footer";
import { getUnreadIncomingTotal } from "@/lib/messages/unread";
import { createClient } from "@/lib/supabase/server";

export default async function WebLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  let unreadMsg = 0;

  if (user) {
    const [profileData, unreadCount] = await Promise.all([
      supabase.from("profiles").select("is_banned,full_name,avatar_url").eq("id", user.id).maybeSingle(),
      getUnreadIncomingTotal(user.id),
    ]);
    
    profile = profileData.data;
    unreadMsg = unreadCount;

    if (profile?.is_banned) {
      redirect("/account-suspended");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bina-bg)]">
      <WebHeader
        hasUser={!!user}
        userId={user?.id ?? null}
        userName={profile?.full_name ?? null}
        userAvatar={profile?.avatar_url ?? null}
        unreadMessageCount={unreadMsg}
      />
      <main className="flex-1">
        {children}
      </main>
      <WebFooter />
    </div>
  );
}
