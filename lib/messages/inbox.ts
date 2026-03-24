import { createClient } from "@/lib/supabase/server";

export type InboxChatRow = {
  id: string;
  created_at: string;
  listing_id: string | null;
  participant1_id: string;
  participant2_id: string;
  listings: { title: string } | null;
};

export type InboxItem = {
  chatId: string;
  listingTitle: string;
  otherId: string;
  otherName: string;
  lastPreview: string | null;
};

export async function getInboxData(userId: string) {
  const supabase = await createClient();
  const { data: chats, error } = await supabase
    .from("chats")
    .select("id, created_at, listing_id, participant1_id, participant2_id, listings ( title )")
    .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message, items: [] as InboxItem[] };
  }

  const rows = (chats ?? []) as InboxChatRow[];
  const otherIds = rows.map((c) =>
    c.participant1_id === userId ? c.participant2_id : c.participant1_id,
  );
  const uniqueOther = [...new Set(otherIds)];

  let nameById = new Map<string, string>();
  if (uniqueOther.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", uniqueOther);
    nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
  }

  const previews = await Promise.all(
    rows.map(async (c) => {
      const { data: last } = await supabase
        .from("messages")
        .select("content")
        .eq("chat_id", c.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return { chatId: c.id, last: last?.content ?? null };
    }),
  );
  const lastByChat = new Map(previews.map((p) => [p.chatId, p.last]));

  const items: InboxItem[] = rows.map((c) => {
    const otherId = c.participant1_id === userId ? c.participant2_id : c.participant1_id;
    const listingRel = c.listings as { title: string } | { title: string }[] | null;
    const listingTitle = Array.isArray(listingRel)
      ? (listingRel[0]?.title ?? "إعلان")
      : (listingRel?.title ?? "إعلان");
    return {
      chatId: c.id,
      listingTitle,
      otherId,
      otherName: nameById.get(otherId) ?? "مستخدم",
      lastPreview: lastByChat.get(c.id) ?? null,
    };
  });

  return { error: null as string | null, items };
}
