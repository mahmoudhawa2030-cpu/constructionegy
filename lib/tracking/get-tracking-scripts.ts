import "server-only";

import { createClient } from "@/lib/supabase/server";

export type TrackingScripts = {
  header: string;
  footer: string;
};

export async function getTrackingScripts(): Promise<TrackingScripts> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("key,value")
    .in("key", ["tracking_header_scripts", "tracking_footer_scripts"]);

  const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value ?? ""]));

  return {
    header: map["tracking_header_scripts"] ?? "",
    footer: map["tracking_footer_scripts"] ?? "",
  };
}
