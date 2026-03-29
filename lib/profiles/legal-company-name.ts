import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

/**
 * Reads `profiles.legal_company_name` in a separate query so the rest of the app still works
 * if the column is not migrated yet (main profile `select` must not list this column).
 */
export async function fetchProfileLegalCompanyName(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("legal_company_name")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return null;
  }
  return data?.legal_company_name ?? null;
}
