import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

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

  let body: { seedKeyword?: string; locale?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const seedKeyword = (body.seedKeyword ?? "").trim();
  if (!seedKeyword)
    return NextResponse.json({ error: "seedKeyword is required" }, { status: 400 });

  // Auto-detect Arabic from keyword
  const detectedLocale = containsArabic(seedKeyword) ? "ar" : (body.locale === "ar" ? "ar" : "en");
  const lang = detectedLocale === "ar" ? "Arabic" : "English";

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey)
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });

  try {
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 1800,
      messages: [
        {
          role: "user",
          content: `Generate a JSON-LD FAQPage schema for the topic: "${seedKeyword}" in ${lang}.

Output ONLY valid JSON — no markdown, no code fences, no explanation.

Use exactly this structure:
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Question text?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Detailed answer here."
      }
    }
  ]
}

Rules:
- Exactly 5 question/answer pairs.
- Questions must be real B2B construction questions people search on Google in Egypt/MENA.
- Answers: 2–4 sentences, specific, actionable, no filler.
- Output ONLY the raw JSON object.`,
        },
      ],
    });

    const block = msg.content[0];
    if (block.type !== "text") throw new Error("Unexpected response type");

    let raw = block.text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("No JSON found in response");

    const schema = JSON.parse(raw.slice(start, end + 1));
    return NextResponse.json({ schema });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Schema generation failed: ${message}` }, { status: 502 });
  }
}
