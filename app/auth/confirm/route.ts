import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { safeAuthNextPath } from "@/lib/auth/safe-redirect-path";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

/**
 * Token-hash recovery links (custom reset-password email template). No PKCE cookie needed — works if the
 * user opens the mail on another device or browser.
 *
 * Supabase Dashboard → Authentication → Email templates → Reset password, set link to:
 * `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/update-password`
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
  const token_hash = searchParams.get("token_hash");
  const typeRaw = searchParams.get("type");
  const nextPath = safeAuthNextPath(searchParams.get("next"), "/update-password");
  const redirectTarget = new URL(nextPath, request.url);

  const errorRedirect = new URL("/forgot-password", request.url);
  errorRedirect.searchParams.set("recovery", "failed");

  if (!token_hash || typeRaw !== "recovery") {
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

  const { error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash });
  if (error) {
    response = NextResponse.redirect(errorRedirect);
  }

  return response;
}
