"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type ListingStatus = Database["public"]["Enums"]["listing_status"];

const STATUSES: ListingStatus[] = ["pending", "active", "sold", "rented"];

export async function updateListingStatusFromForm(formData: FormData) {
  await requireAdmin();
  const listingId = formData.get("listing_id");
  const status = formData.get("status");
  if (typeof listingId !== "string" || typeof status !== "string") {
    throw new Error("بيانات غير صالحة");
  }
  if (!STATUSES.includes(status as ListingStatus)) {
    throw new Error("حالة غير صالحة");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("listings")
    .update({ status: status as ListingStatus })
    .eq("id", listingId);
  if (error) {
    throw new Error(error.message);
  }
  revalidatePath("/admin");
  revalidatePath("/admin/listings");
  revalidatePath("/gallery");
  revalidatePath(`/listings/${listingId}`);
}
