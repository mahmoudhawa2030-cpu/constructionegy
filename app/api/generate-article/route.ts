import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const maxDuration = 120;

type GenerateBody = {
  seedKeyword?: string;
  category?: string;
  locale?: "ar" | "en";
  externalSource?: string;
  recentPosts?: Array<{ slug: string; title: string }>;
};

async function callClaude(
  client: Anthropic,
  model: string,
  prompt: string,
  maxTokens: number,
): Promise<string> {
  const msg = await client.messages.create({
    model,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });
  const block = msg.content[0];
  if (block.type !== "text") throw new Error("Unexpected content type from Claude");
  return block.text.trim();
}

function slugify(t: string): string {
  return t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

// Auto-detect Arabic text (Unicode range: 0600-06FF for Arabic script)
function containsArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: GenerateBody;
  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const seedKeyword = (body.seedKeyword ?? "").trim();
  const category = (body.category ?? "").trim();
  // Auto-detect Arabic from keyword if locale not explicitly set
  const detectedLocale = containsArabic(seedKeyword) ? "ar" : (body.locale === "ar" ? "ar" : "en");
  const locale: "ar" | "en" = detectedLocale;

  if (!seedKeyword)
    return NextResponse.json({ error: "seedKeyword is required" }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey)
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });

  const externalSource = (body.externalSource ?? "").trim();
  const recentPosts = body.recentPosts ?? [];

  const lang = locale === "ar" ? "Arabic" : "English";
  const intLinks =
    recentPosts
      .slice(0, 6)
      .map((p) => `<a href="/${p.slug}">${p.title}</a>`)
      .join(", ") || `<a href="/${category || "blog"}">Related ${category || "blog"} articles</a>`;
  const extNote = externalSource
    ? `Use this URL as one of your external links: ${externalSource}. Also add 1–2 other real authoritative sources.`
    : "Include 2–3 external links to real authoritative construction or engineering websites (e.g., ASTM, ISO, CIOB, Buildipedia, ENR).";

  try {
    const client = new Anthropic({ apiKey });

    // ── Call 1: Article body — Sonnet for depth and quality ────────────────
    const content = await callClaude(
      client,
      "claude-3-5-sonnet-20241022",
      `You are an expert SEO content writer for a B2B construction marketplace in Egypt.
Write a comprehensive blog article in ${lang} about: "${seedKeyword}" (category: ${category}).

STRICT RULES — follow all 13:
1. Length: exactly 1600–2000 words.
2. Use the exact keyword "${seedKeyword}" within the first 80 words.
3. Add one <h2> heading every 250–300 words.
4. Mention the keyword naturally 5–8 times total throughout the article.
5. ${extNote}
6. Include 1–2 internal links using these anchor tags: ${intLinks}
7. Target B2B audience: contractors, project managers, procurement officers in Egypt.
8. Include at least 3 real data points or statistics relevant to construction in Egypt/MENA.
9. End with a strong CTA paragraph inviting readers to contact or explore services.
10. Use semantic HTML only: <h2>, <h3>, <p>, <ul><li>, <ol><li>, <strong>, <a href>.
11. Do NOT include <html>, <head>, <body>, or any document-level wrapper tags.
12. Do NOT use markdown syntax. Output pure HTML only.
13. No placeholder text — every sentence must be specific, researched, and valuable.

Output ONLY the raw HTML article body. No JSON wrapper. No explanation. No preamble.`,
      8000,
    );

    // ── Call 2: Meta title — Haiku for speed ──────────────────────────────
    const rawTitle = await callClaude(
      client,
      "claude-3-5-haiku-20241022",
      `Write ONE SEO meta title in ${lang} for an article about "${seedKeyword}".
Rules:
- Exactly 52–59 characters total (count every character including spaces carefully).
- Must contain the exact phrase "${seedKeyword}".
- Include one power word: Best, Top, Complete, Ultimate, Essential, Proven, or Expert.
- No surrounding quotes, no trailing punctuation.
- Output ONLY the title text. Nothing else.`,
      120,
    );
    const metaTitle = rawTitle.replace(/^["'`]|["'`]$/g, "").trim().slice(0, 60);

    // ── Call 3: Meta description — Haiku for speed ────────────────────────
    const rawDesc = await callClaude(
      client,
      "claude-3-5-haiku-20241022",
      `Write ONE SEO meta description in ${lang} for a page titled: "${metaTitle}".
Rules:
- Exactly 130–155 characters total (count carefully).
- Include the exact phrase "${seedKeyword}".
- Include one CTA word: Discover, Learn, Explore, Get, Find, or See.
- Write in active voice only.
- Output ONLY the description text. Nothing else.`,
      200,
    );
    const metaDescription = rawDesc.replace(/^["'`]|["'`]$/g, "").trim().slice(0, 160);

    const slug = slugify(metaTitle || seedKeyword);

    return NextResponse.json({ content, metaTitle, metaDescription, slug });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Generation failed: ${message}` }, { status: 502 });
  }
}
