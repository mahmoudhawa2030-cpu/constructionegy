"use server";

import { createClient } from "@/lib/supabase/server";

/** Called from the client on an interval while the user is logged in. */
export async function recordPresence(): Promise<{ ok: true } | { ok: false }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false };
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("profiles")
    .update({ last_seen_at: now, last_active_at: now })
    .eq("id", user.id);

  if (error) {
    return { ok: false };
  }
  return { ok: true };
}
