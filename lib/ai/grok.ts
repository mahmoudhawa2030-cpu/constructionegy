/**
 * xAI Grok client (OpenAI-compatible Chat Completions API).
 * Key resolution order: explicit override → app_settings.xai_api_key → env XAI_API_KEY.
 */

import { createClient } from "@/lib/supabase/server";

const XAI_BASE = "https://api.x.ai/v1";
export const XAI_APP_SETTING_KEY = "xai_api_key";

export type GrokChatOptions = {
  prompt: string;
  system?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  /** Prefer this key when set (e.g. from SEO editor field). */
  apiKey?: string | null;
};

/** Env-only (sync). Prefer resolveXaiApiKey for full resolution. */
export function getXaiApiKey(): string | null {
  return process.env.XAI_API_KEY?.trim() || null;
}

/** Strong model for long-form article generation */
export function grokArticleModel(): string {
  return process.env.XAI_MODEL_ARTICLE?.trim() || process.env.XAI_MODEL?.trim() || "grok-3";
}

/** Faster model for meta, schema, rewrite */
export function grokFastModel(): string {
  return process.env.XAI_MODEL_FAST?.trim() || process.env.XAI_MODEL?.trim() || "grok-3-mini";
}

/** Resolve key: override → DB app_settings → environment. */
export async function resolveXaiApiKey(override?: string | null): Promise<string | null> {
  const fromOverride = (override ?? "").trim();
  if (fromOverride) return fromOverride;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", XAI_APP_SETTING_KEY)
      .maybeSingle();
    const fromDb = data?.value?.trim();
    if (fromDb) return fromDb;
  } catch {
    /* ignore — fall through to env */
  }

  return getXaiApiKey();
}

export async function callGrok(options: GrokChatOptions): Promise<string> {
  const apiKey = await resolveXaiApiKey(options.apiKey);
  if (!apiKey) {
    throw new Error("Grok API key is not configured. Add it in the SEO editor or set XAI_API_KEY.");
  }

  const model = options.model || grokFastModel();
  const messages: Array<{ role: "system" | "user"; content: string }> = [];
  if (options.system) messages.push({ role: "system", content: options.system });
  messages.push({ role: "user", content: options.prompt });

  const res = await fetch(`${XAI_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: options.maxTokens ?? 2000,
      temperature: options.temperature ?? 0.7,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    let detail = errText.slice(0, 400);
    try {
      const j = JSON.parse(errText) as { error?: { message?: string } | string };
      if (typeof j.error === "string") detail = j.error;
      else if (j.error?.message) detail = j.error.message;
    } catch {
      /* keep raw */
    }
    throw new Error(`Grok API ${res.status}: ${detail || res.statusText}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Empty response from Grok");
  return text;
}
