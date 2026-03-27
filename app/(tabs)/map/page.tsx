import { redirect } from "next/navigation";

import { MapPageShell } from "@/components/map-page-shell";
import { createClient } from "@/lib/supabase/server";

export default async function MapPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/map")}`);
  }

  return <MapPageShell userId={user.id} />;
}
