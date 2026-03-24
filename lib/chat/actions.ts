"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

function sortParticipantIds(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export type StartChatResult =
  | { ok: true; chatId: string }
  | { ok: false; reason: "login" | "not_found" | "own_listing" | "error"; message?: string };

export async function getOrCreateChatForListing(listingId: string): Promise<StartChatResult> {
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
}

export type SendMessageResult = { ok: true } | { ok: false; message: string };

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

  const { error } = await supabase.from("messages").insert({
    chat_id: chatId,
    sender_id: user.id,
    content: trimmed,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/messages");
  revalidatePath(`/messages/${chatId}`);
  return { ok: true };
}
