import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

/**
 * Service-role client (server-only). Required for `auth.admin.deleteUser`.
 * Set `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` — never expose to the browser.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";

  if (!url || !key) {
    return null;
  }

  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
