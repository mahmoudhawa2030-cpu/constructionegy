import { createClient } from "@/lib/supabase/server";

/** Incoming messages (from others) with read_at null, across all chats the user participates in. */
export async function getUnreadIncomingTotal(userId: string): Promise<number> {
  const supabase = await createClient();

  const [chatsRes, countRes] = await Promise.all([
    supabase
      .from("chats")
      .select("id")
      .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`),
    // Pre-fire a broad count; we'll filter by chatIds after both resolve
    supabase
      .from("messages")
      .select("chat_id", { count: "exact", head: false })
      .is("read_at", null)
      .neq("sender_id", userId),
  ]);

  if (chatsRes.error || !chatsRes.data?.length) return 0;

  const chatIdSet = new Set(chatsRes.data.map((c) => c.id));
  const unreadInMyChats = (countRes.data ?? []).filter((m) =>
    chatIdSet.has((m as { chat_id: string }).chat_id),
  ).length;

  return unreadInMyChats;
}
