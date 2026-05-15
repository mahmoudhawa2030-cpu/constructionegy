import { notFound, redirect } from "next/navigation";

import { UserAdsList } from "@/components/user-ads-list";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type PageProps = { params: Promise<{ id: string }> };

/** Public catalog for another user. The signed-in owner’s list lives at `/` instead. */
export default async function UserAdsPage({ params }: PageProps) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.id === id) {
    redirect("/users/myads");
  }

  return <UserAdsList profileUserId={id} />;
}
