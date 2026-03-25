import { createClient } from "@/lib/supabase/server";

export type StartChatResult =
  | { ok: true; chatId: string }
  | { ok: false; reason: "login" | "not_found" | "own_listing" | "error"; message?: string };

function sortParticipantIds(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

/** Shared implementation (no revalidation). Used by the server action and POST /api/chat/for-listing. */
export async function getOrCreateChatForListingCore(listingId: string): Promise<StartChatResult> {
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

    return { ok: true, chatId: inserted.id };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, reason: "error", message };
  }
}
