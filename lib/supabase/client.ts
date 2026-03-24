import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./database.types";
import { getSupabasePublicEnv } from "./env";

export function createClient() {
  const { url, key } = getSupabasePublicEnv();

  return createBrowserClient<Database>(url, key);
}
