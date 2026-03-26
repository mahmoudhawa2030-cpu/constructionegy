"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

/** Called when a buyer taps the seller phone (tel:) link. */
export async function recordListingPhoneClick(listingId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: listing } = await supabase
    .from("listings")
    .select("user_id")
    .eq("id", listingId)
    .maybeSingle();

  const { error } = await supabase.rpc("increment_listing_phone_click", {
    p_listing_id: listingId,
  });
  if (error) {
    console.error("[recordListingPhoneClick]", error);
    return;
  }

  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/users/myads");
  if (listing?.user_id) {
    revalidatePath(`/users/${listing.user_id}/ads`);
  }
}
