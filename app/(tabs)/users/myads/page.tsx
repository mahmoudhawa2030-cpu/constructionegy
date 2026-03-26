import { redirect } from "next/navigation";

import { UserAdsList } from "@/components/user-ads-list";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Signed-in user’s ads — stable URL without UUID (`/users/myads`). */
export default async function MyAdsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/users/myads")}`);
  }

  return <UserAdsList profileUserId={user.id} />;
}
