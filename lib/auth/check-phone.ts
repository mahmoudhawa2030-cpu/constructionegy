"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Returns true if the phone number is already taken by any profile.
 * Safe to call from signup (no auth required — uses service-level check).
 */
export async function isPhoneTaken(phone: string): Promise<boolean> {
  if (!phone.trim()) return false;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("phone_number", phone.trim())
    .limit(1)
    .maybeSingle();
  return !!data;
}
