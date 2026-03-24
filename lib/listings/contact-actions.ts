"use server";

import { createClient } from "@/lib/supabase/server";

export type RevealSellerPhoneResult =
  | { ok: true; phone: string | null }
  | { ok: false; reason: "login" | "not_found" | "own_listing" | "error"; message?: string };

export async function revealSellerPhoneForListing(
  listingId: string
): Promise<RevealSellerPhoneResult> {
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

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("phone_number")
    .eq("id", listing.user_id)
    .maybeSingle();

  if (profileErr) {
    return { ok: false, reason: "error", message: profileErr.message };
  }

  return { ok: true, phone: profile?.phone_number ?? null };
}
