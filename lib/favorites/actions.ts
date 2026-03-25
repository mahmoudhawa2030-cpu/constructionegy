"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type FavoriteToggleResult =
  | { ok: true; favorited: boolean }
  | { ok: false; message: string };

export async function toggleListingFavorite(listingId: string): Promise<FavoriteToggleResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "يجب تسجيل الدخول أولاً." };
  }

  const { data: existing, error: selErr } = await supabase
    .from("listing_favorites")
    .select("listing_id")
    .eq("user_id", user.id)
    .eq("listing_id", listingId)
    .maybeSingle();

  if (selErr) {
    return { ok: false, message: selErr.message };
  }

  if (existing) {
    const { error: delErr } = await supabase
      .from("listing_favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("listing_id", listingId);

    if (delErr) {
      return { ok: false, message: delErr.message };
    }
    revalidatePath("/favorites");
    revalidatePath(`/listings/${listingId}`);
    return { ok: true, favorited: false };
  }

  const { error: insErr } = await supabase.from("listing_favorites").insert({
    user_id: user.id,
    listing_id: listingId,
  });

  if (insErr) {
    return { ok: false, message: insErr.message };
  }

  revalidatePath("/favorites");
  revalidatePath(`/listings/${listingId}`);
  return { ok: true, favorited: true };
}
