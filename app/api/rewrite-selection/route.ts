import { NextRequest, NextResponse } from "next/server";

import { callGrok, resolveXaiApiKey, grokFastModel } from "@/lib/ai/grok";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

type RewriteMode = "rewrite" | "expand" | "shorten" | "improve";

type RewriteBody = {
  text?: string;
  mode?: RewriteMode;
  keyword?: string;
  locale?: "ar" | "en";
  xaiApiKey?: string;
};

const SYSTEM_PROMPTS: Record<RewriteMode, string> = {
  rewrite: "Rewrite the following HTML passage to make it clearer, more engaging, and better optimised for the given keyword. Keep the same approximate length. Return ONLY the rewritten HTML — no explanation.",
  expand: "Expand the following HTML passage with 1–2 additional sentences of specific, valuable detail. Keep the same tone and HTML structure. Return ONLY the expanded HTML — no explanation.",
  shorten: "Shorten the following HTML passage by about 30% while keeping all key information. Return ONLY the shortened HTML — no explanation.",
  improve: "Improve the readability and SEO of the following HTML passage: fix passive voice, add transition words, and make sentences more concise. Return ONLY the improved HTML — no explanation.",
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: RewriteBody;
  try {
    body = (await req.json()) as RewriteBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  const mode: RewriteMode = (body.mode as RewriteMode) ?? "rewrite";
  const keyword = (body.keyword ?? "").trim();
  const locale = body.locale === "ar" ? "ar" : "en";
  const lang = locale === "ar" ? "Arabic" : "English";

  if (!text) return NextResponse.json({ error: "text is required" }, { status: 400 });
  if (!SYSTEM_PROMPTS[mode]) return NextResponse.json({ error: "Invalid mode" }, { status: 400 });

  const xaiApiKey = await resolveXaiApiKey(body.xaiApiKey);
  if (!xaiApiKey)
    return NextResponse.json(
      { error: "Grok API key missing. Paste it in the SEO editor or set XAI_API_KEY." },
      { status: 500 },
    );

  try {
    const result = await callGrok({
      apiKey: xaiApiKey,
      model: grokFastModel(),
      maxTokens: 1200,
      temperature: 0.5,
      prompt: `${SYSTEM_PROMPTS[mode]}
Language: ${lang}${keyword ? `\nFocus keyword: "${keyword}"` : ""}

HTML to process:
${text}`,
    });

    return NextResponse.json({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Rewrite failed: ${message}` }, { status: 502 });
  }
}
