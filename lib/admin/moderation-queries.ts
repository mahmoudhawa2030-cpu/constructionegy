import { createClient } from "@/lib/supabase/server";

export const ADMIN_CHATS_PAGE_SIZE = 25;

type ListingRel = { title: string } | { title: string }[] | null;

function listingTitle(listings: ListingRel): string {
  if (!listings) return "—";
  if (Array.isArray(listings)) return listings[0]?.title ?? "—";
  return listings.title ?? "—";
}

export type AdminChatRow = {
  id: string;
  created_at: string;
  listing_id: string | null;
  participant1_id: string;
  participant2_id: string;
  listings: ListingRel;
};

export async function getAdminChatsPage(page: number) {
  const supabase = await createClient();
  const safePage = Math.max(1, Math.floor(page));
  const from = (safePage - 1) * ADMIN_CHATS_PAGE_SIZE;
  const to = from + ADMIN_CHATS_PAGE_SIZE - 1;

  const { data: chats, error, count } = await supabase
    .from("chats")
    .select("id, created_at, listing_id, participant1_id, participant2_id, listings ( title )", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return {
      error: error.message,
      chats: [] as AdminChatRow[],
      total: 0,
      lastByChat: new Map<string, string | null>(),
      nameById: new Map<string, string>(),
      listingTitle,
      page: safePage,
    };
  }

  const rows = (chats ?? []) as AdminChatRow[];
  const ids = new Set<string>();
  for (const c of rows) {
    ids.add(c.participant1_id);
    ids.add(c.participant2_id);
  }

  let nameById = new Map<string, string>();
  if (ids.size > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", [...ids]);
    nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
  }

  const lastByChat = new Map<string, string | null>();
  await Promise.all(
    rows.map(async (c) => {
      const { data: last } = await supabase
        .from("messages")
        .select("content")
        .eq("chat_id", c.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      lastByChat.set(c.id, last?.content ?? null);
    }),
  );

  return {
    error: null as string | null,
    chats: rows,
    total: count ?? 0,
    nameById,
    lastByChat,
    listingTitle,
    page: safePage,
  };
}

export type AdminMessageRow = {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read_at: string | null;
};

export async function getAdminChatThread(chatId: string) {
  const supabase = await createClient();

  const { data: chat, error: cErr } = await supabase
    .from("chats")
    .select("id, created_at, listing_id, participant1_id, participant2_id, listings ( title )")
    .eq("id", chatId)
    .maybeSingle();

  if (cErr || !chat) {
    return {
      error: cErr?.message ?? "المحادثة غير موجودة.",
      chat: null as null,
      messages: [] as AdminMessageRow[],
      nameById: new Map<string, string>(),
    };
  }

  const { data: messages, error: mErr } = await supabase
    .from("messages")
    .select("id, content, sender_id, created_at, read_at")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true })
    .limit(500);

  if (mErr) {
    return {
      error: mErr.message,
      chat: null as null,
      messages: [] as AdminMessageRow[],
      nameById: new Map<string, string>(),
    };
  }

  const msgRows = (messages ?? []) as AdminMessageRow[];
  const row = chat as AdminChatRow;
  const needIds = [...new Set([row.participant1_id, row.participant2_id, ...msgRows.map((m) => m.sender_id)])];
  let nameById = new Map<string, string>();
  if (needIds.length > 0) {
    const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", needIds);
    nameById = new Map((profs ?? []).map((p) => [p.id, p.full_name]));
  }

  return {
    error: null as string | null,
    chat: row,
    messages: msgRows,
    nameById,
    listingTitle,
  };
}
