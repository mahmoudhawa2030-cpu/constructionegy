import { redirect } from "next/navigation";

import { TabsChrome } from "@/components/tabs-chrome";
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

  return <TabsChrome hasUser={Boolean(user)}>{children}</TabsChrome>;
}
