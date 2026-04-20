/**
 * All profile-related database queries in one place.
 * When migrating away from Supabase, only this file needs to change.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];

export type ProfilePublic = Pick<
  ProfileRow,
  | "id"
  | "full_name"
  | "user_type"
  | "avatar_url"
  | "location"
  | "phone_number"
  | "whatsapp_number"
  | "business_verification_status"
  | "expert_verification_status"
>;

export async function getProfileById(
  client: SupabaseClient<Database>,
  id: string,
): Promise<ProfilePublic | null> {
  const { data } = await client
    .from("profiles")
    .select(
      "id,full_name,user_type,avatar_url,location,phone_number,whatsapp_number,business_verification_status,expert_verification_status",
    )
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
}

export async function upsertProfile(
  client: SupabaseClient<Database>,
  fields: ProfileInsert,
): Promise<{ error: string | null }> {
  const { error } = await client
    .from("profiles")
    .upsert(fields, { onConflict: "id" });
  return { error: error?.message ?? null };
}

export async function getProfilesMini(
  client: SupabaseClient<Database>,
  ids: string[],
): Promise<Pick<ProfileRow, "id" | "full_name" | "user_type" | "business_verification_status" | "expert_verification_status" | "avatar_url">[]> {
  if (!ids.length) return [];
  const { data } = await client
    .from("profiles")
    .select("id,full_name,user_type,business_verification_status,expert_verification_status,avatar_url")
    .in("id", ids);
  return data ?? [];
}
