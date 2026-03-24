import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "./database.types";
import { getSupabasePublicEnv } from "./env";

export async function createClient() {
  const cookieStore = await cookies();

  const { url, key } = getSupabasePublicEnv();

  return createServerClient<Database>(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components cannot set cookies; Proxy refreshes the session.
          }
        },
      },
    },
  );
}
