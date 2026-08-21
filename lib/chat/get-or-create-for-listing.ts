export type StartChatResult =
  | { ok: true; chatId: string }
  | { ok: false; reason: "login" | "not_found" | "own_listing" | "error"; message?: string };

/** Listing contact is phone-only. Always rejects new listing chats. */
export async function getOrCreateChatForListingCore(_listingId: string): Promise<StartChatResult> {
  return {
    ok: false,
    reason: "error",
    message: "التواصل على الإعلانات متاح عبر رقم الهاتف فقط.",
  };
}
