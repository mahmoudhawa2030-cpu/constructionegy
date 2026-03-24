import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "./database.types";
import { getSupabasePublicEnv } from "./env";

function missingSupabaseEnvHtml(): NextResponse {
  const body = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>إعدادات الخادم</title>
</head>
<body style="font-family:system-ui,sans-serif;max-width:40rem;margin:2rem auto;padding:0 1rem;line-height:1.6">
  <h1 style="font-size:1.25rem">خطأ في إعدادات الخادم</h1>
  <p>لم يتم ضبط متغيرات بيئة Supabase (غالباً على Vercel).</p>
  <p><strong>أضف في Vercel:</strong> Project → Settings → Environment Variables (Production و Preview إن لزم)، ثم <strong>Redeploy</strong>:</p>
  <ul>
    <li><code>NEXT_PUBLIC_SUPABASE_URL</code></li>
    <li><code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> أو <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code></li>
  </ul>
  <p>القيم من لوحة Supabase: Project Settings → API.</p>
</body>
</html>`;
  return new NextResponse(body, {
    status: 503,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  let url: string;
  let key: string;
  try {
    ({ url, key } = getSupabasePublicEnv());
  } catch (err) {
    console.error("[Supabase] Missing public env (check Vercel Environment Variables):", err);
    return missingSupabaseEnvHtml();
  }

  const supabase = createServerClient<Database>(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  try {
    await supabase.auth.getClaims();
  } catch (e) {
    console.error("[Supabase] updateSession getClaims failed:", e);
  }

  return supabaseResponse;
}
