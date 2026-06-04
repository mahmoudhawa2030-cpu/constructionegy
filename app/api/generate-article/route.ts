import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

type GenerateBody = {
  seedKeyword?: string;
  category?: string;
  locale?: "ar" | "en";
};

type GeneratedArticle = {
  content: string;
  metaTitle: string;
  metaDescription: string;
};

function buildPrompt(seedKeyword: string, category: string, locale: "ar" | "en"): string {
  const lang = locale === "ar" ? "Arabic" : "English";
  return `You are an expert SEO content writer for a B2B construction marketplace in Egypt.
Write a comprehensive, original blog article in ${lang} about the seed keyword: "${seedKeyword}"${
    category ? ` (category: ${category})` : ""
  }.

Strict requirements:
- At least 1500 words.
- Use the exact seed keyword within the first 100 words (in the introduction/hook).
- Model the article around clear B2B search intent (buyers, contractors, suppliers).
- Use semantic HTML headings (<h2>, <h3>), paragraphs (<p>), and bullet lists (<ul><li>).
- Include at least ONE external link to an authoritative source using a real, well-known domain (e.g. an industry standards body or reputable reference), as an <a href="..."> tag.
- Include at least ONE internal link suggestion as <a href="/${category || "category"}">...</a>.
- Do NOT include <html>, <head>, or <body> tags. Output only the article body HTML.

Return ONLY valid minified JSON (no markdown fences) with exactly these keys:
{"content":"<the full HTML article>","metaTitle":"<= 60 chars, includes the keyword","metaDescription":"<= 160 chars, includes the keyword"}`;
}

function extractJson(raw: string): GeneratedArticle | null {
  let text = raw.trim();
  // Strip markdown fences if the model added them.
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    if (
      typeof parsed.content === "string" &&
      typeof parsed.metaTitle === "string" &&
      typeof parsed.metaDescription === "string"
    ) {
      return parsed as GeneratedArticle;
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  let body: GenerateBody;
  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const seedKeyword = (body.seedKeyword ?? "").trim();
  const category = (body.category ?? "").trim();
  const locale: "ar" | "en" = body.locale === "ar" ? "ar" : "en";

  if (!seedKeyword) {
    return NextResponse.json({ error: "seedKeyword is required" }, { status: 400 });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
    });

    const result = await model.generateContent(buildPrompt(seedKeyword, category, locale));
    const raw = result.response.text();
    const article = extractJson(raw);

    if (!article) {
      return NextResponse.json(
        { error: "The model returned an unparseable response. Try again." },
        { status: 502 },
      );
    }

    return NextResponse.json(article);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Generation failed: ${message}` }, { status: 502 });
  }
}
