import { redirect } from "next/navigation";

import { MapPageShell } from "@/components/map-page-shell";
import { getActiveCategoriesForSelect } from "@/lib/categories/queries";
import { canAccessFeature } from "@/lib/subscriptions/can-access";
import { createClient } from "@/lib/supabase/server";

export default async function MapPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/map")}`);
  }

  const categories = await getActiveCategoriesForSelect();
  const canUseLiveMap = await canAccessFeature(user.id, "live_map");

  return <MapPageShell canUseLiveMap={canUseLiveMap} categories={categories} userId={user.id} />;
}
