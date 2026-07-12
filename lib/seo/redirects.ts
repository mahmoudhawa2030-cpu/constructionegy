import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

/**
 * Stateless (no-cookie) Supabase client for use in `proxy.ts`, where we only
 * need to call public RPC functions (`resolve_redirect`, `log_not_found`).
 */
function getStatelessClient() {
  const { url, key } = getSupabasePublicEnv();
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type ResolvedRedirect = { destinationPath: string; statusCode: number };

/**
 * Looks up an active redirect for `pathname` and increments its hit count.
 * Returns `null` on no match or on any error (never blocks the request).
 */
export async function resolveRedirect(pathname: string): Promise<ResolvedRedirect | null> {
  try {
    const supabase = getStatelessClient();
    const { data, error } = await supabase.rpc("resolve_redirect", { p_path: pathname });
    if (error || !data || data.length === 0) return null;
    const row = data[0];
    return { destinationPath: row.destination_path, statusCode: row.status_code };
  } catch {
    return null;
  }
}

/**
 * Logs (or bumps) a 404 hit for `pathname`. Fire-and-forget; never throws.
 */
export async function logNotFound(pathname: string, referrer: string | null): Promise<void> {
  try {
    const supabase = getStatelessClient();
    await supabase.rpc("log_not_found", { p_path: pathname, p_referrer: referrer });
  } catch {
    // Ignore: 404 logging must never break the page render.
  }
}
