import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

/**
 * After a new session is created (sign-in / sign-up), invalidates every other
 * refresh token for this user. The current device keeps its session.
 * @see https://supabase.com/docs/reference/javascript/auth-signout
 */
export async function revokeOtherSessions(supabase: SupabaseClient<Database>) {
  return supabase.auth.signOut({ scope: "others" });
}
