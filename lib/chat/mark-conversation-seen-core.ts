import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

/**
 * Recipient marks the other party’s messages as delivered then read (WhatsApp-style ticks).
 * Call with the same Supabase client the user is authenticated on (browser or server).
 */
export async function markConversationSeenWithClient(
  supabase: SupabaseClient<Database>,
  chatId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "يجب تسجيل الدخول." };
  }

  const now = new Date().toISOString();

  const { error: e1 } = await supabase
    .from("messages")
    .update({ delivered_at: now })
    .eq("chat_id", chatId)
    .neq("sender_id", user.id)
    .is("delivered_at", null);

  if (e1) {
    return { ok: false, message: e1.message };
  }

  const { error: e2 } = await supabase
    .from("messages")
    .update({ read_at: now })
    .eq("chat_id", chatId)
    .neq("sender_id", user.id)
    .is("read_at", null);

  if (e2) {
    return { ok: false, message: e2.message };
  }

  return { ok: true };
}
