import { NextRequest, NextResponse } from "next/server";

import { XAI_APP_SETTING_KEY, getXaiApiKey } from "@/lib/ai/grok";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_admin) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };

  return { supabase };
}

function maskKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
}

/** GET — whether a key is configured (never returns the full secret). */
export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;
  const { supabase } = auth as { supabase: Awaited<ReturnType<typeof createClient>> };

  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", XAI_APP_SETTING_KEY)
    .maybeSingle();

  const dbKey = data?.value?.trim() || "";
  const envKey = getXaiApiKey() || "";
  const source = dbKey ? "editor" : envKey ? "env" : null;
  const configured = Boolean(source);
  const masked = dbKey ? maskKey(dbKey) : envKey ? maskKey(envKey) : null;

  return NextResponse.json({ configured, source, masked });
}

/** POST — save key from SEO editor into app_settings (admin only). */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;
  const { supabase } = auth as { supabase: Awaited<ReturnType<typeof createClient>> };

  let body: { key?: string };
  try {
    body = (await req.json()) as { key?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const key = (body.key ?? "").trim();
  if (!key) return NextResponse.json({ error: "key is required" }, { status: 400 });
  if (key.length < 10) return NextResponse.json({ error: "Key looks too short" }, { status: 400 });

  const { error } = await supabase.from("app_settings").upsert(
    { key: XAI_APP_SETTING_KEY, value: key },
    { onConflict: "key" },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, configured: true, masked: maskKey(key), source: "editor" });
}

/** DELETE — remove saved editor key (env key still works if set). */
export async function DELETE() {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;
  const { supabase } = auth as { supabase: Awaited<ReturnType<typeof createClient>> };

  const { error } = await supabase.from("app_settings").delete().eq("key", XAI_APP_SETTING_KEY);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const envConfigured = Boolean(getXaiApiKey());
  return NextResponse.json({
    ok: true,
    configured: envConfigured,
    source: envConfigured ? "env" : null,
    masked: envConfigured ? maskKey(getXaiApiKey()!) : null,
  });
}
