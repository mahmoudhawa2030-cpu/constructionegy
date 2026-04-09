import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { safeAuthNextPath } from "@/lib/auth/safe-redirect-path";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

/**
 * PKCE password recovery (and other OAuth-style redirects): Supabase sends users here with `?code=`
 * after /auth/v1/verify. We exchange the code on the server so session cookies are set reliably.
 * @see https://supabase.com/docs/guides/auth/passwords
 */
export async function GET(request: NextRequest) {
  let url: string;
  let key: string;
  try {
    ({ url, key } = getSupabasePublicEnv());
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const nextPath = safeAuthNextPath(searchParams.get("next"), "/update-password");
  const redirectTarget = new URL(nextPath, request.url);

  const errorRedirect = new URL("/forgot-password", request.url);
  errorRedirect.searchParams.set("recovery", "failed");

  if (!code) {
    return NextResponse.redirect(errorRedirect);
  }

  let response = NextResponse.redirect(redirectTarget);

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    response = NextResponse.redirect(errorRedirect);
  }

  return response;
}
