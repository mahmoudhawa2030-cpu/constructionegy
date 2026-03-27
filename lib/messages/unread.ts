import { createClient } from "@/lib/supabase/server";

/** Incoming messages (from others) with read_at null, across all chats the user participates in. */
export async function getUnreadIncomingTotal(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data: chats, error: chatsErr } = await supabase
    .from("chats")
    .select("id")
    .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`);

  if (chatsErr || !chats?.length) {
    return 0;
  }

  const chatIds = chats.map((c) => c.id);
  const { count, error } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .in("chat_id", chatIds)
    .is("read_at", null)
    .neq("sender_id", userId);

  if (error) {
    return 0;
  }

  return count ?? 0;
}
