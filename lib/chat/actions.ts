"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

function sortParticipantIds(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export type StartChatResult =
  | { ok: true; chatId: string }
  | { ok: false; reason: "login" | "not_found" | "own_listing" | "error"; message?: string };

export async function getOrCreateChatForListing(listingId: string): Promise<StartChatResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { ok: false, reason: "login" };
    }

    const { data: listing, error: listingErr } = await supabase
      .from("listings")
      .select("id, user_id")
      .eq("id", listingId)
      .maybeSingle();

    if (listingErr || !listing) {
      return { ok: false, reason: "not_found" };
    }

    if (listing.user_id === user.id) {
      return { ok: false, reason: "own_listing" };
    }

    const [participant1_id, participant2_id] = sortParticipantIds(user.id, listing.user_id);

    const { data: existing } = await supabase
      .from("chats")
      .select("id")
      .eq("listing_id", listingId)
      .eq("participant1_id", participant1_id)
      .eq("participant2_id", participant2_id)
      .maybeSingle();

    if (existing?.id) {
      return { ok: true, chatId: existing.id };
    }

    const { data: inserted, error } = await supabase
      .from("chats")
      .insert({
        participant1_id,
        participant2_id,
        listing_id: listingId,
      })
      .select("id")
      .single();

    if (error) {
      return { ok: false, reason: "error", message: error.message };
    }

    revalidatePath("/messages");
    return { ok: true, chatId: inserted.id };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, reason: "error", message };
  }
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
