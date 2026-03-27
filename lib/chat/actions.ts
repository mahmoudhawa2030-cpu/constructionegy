"use server";

import { revalidatePath } from "next/cache";

import { markConversationSeenWithClient } from "@/lib/chat/mark-conversation-seen-core";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateChatForListingCore, type StartChatResult } from "@/lib/chat/get-or-create-for-listing";
import type { Database } from "@/lib/supabase/database.types";

type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

export type { StartChatResult };

export async function getOrCreateChatForListing(listingId: string): Promise<StartChatResult> {
  const result = await getOrCreateChatForListingCore(listingId);
  if (result.ok) {
    revalidatePath("/messages");
  }
  return result;
}

export type SendMessageResult =
  | { ok: true; message: MessageRow }
  | { ok: false; message: string };

export async function sendMessage(chatId: string, content: string): Promise<SendMessageResult> {
  const trimmed = content.trim();
  if (!trimmed) {
    return { ok: false, message: "اكتب رسالة." };
  }
  if (trimmed.length > 5000) {
    return { ok: false, message: "الرسالة طويلة جداً." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "يجب تسجيل الدخول." };
  }

  const { data: row, error } = await supabase
    .from("messages")
    .insert({
      chat_id: chatId,
      sender_id: user.id,
      content: trimmed,
    })
    .select()
    .single();

  if (error || !row) {
    return { ok: false, message: error?.message ?? "فشل الإرسال." };
  }

  revalidatePath("/messages");
  revalidatePath(`/messages/${chatId}`);
  return { ok: true, message: row };
}

/**
 * Recipient: mark incoming messages as delivered, then read (WhatsApp-style ✓ / ✓✓ for the sender).
 * Safe to call repeatedly; only fills null timestamps.
 */
export async function markConversationSeen(chatId: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = await createClient();
  return markConversationSeenWithClient(supabase, chatId);
}
