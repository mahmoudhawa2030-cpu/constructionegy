import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

// ─────────────────────────────────────────────────────────────────────────
// DEMO MODE: Generates realistic FAQ schema when Anthropic API is unavailable
// ─────────────────────────────────────────────────────────────────────────
function generateDemoFaqSchema(seedKeyword: string, locale: string) {
  const isAr = locale === "ar";

  const faqs = isAr ? [
    { q: `ما هو ${seedKeyword} وكيف يستخدم في المشاريع الإنشائية؟`, a: `${seedKeyword} هو نظام متخصص يستخدم في المشاريع الإنشائية لضمان السلامة والكفاءة. يتضمن معدات ومواد عالية الجودة تتوافق مع معايير ASTM وISO الدولية.` },
    { q: `كم تكلفة ${seedKeyword} في مصر؟`, a: `تتراوح تكلفة ${seedKeyword} بين 5,000 و 25,000 جنيه مصري حسب مواصفات المشروع والمدة المطلوبة. تشمل الأسعار عادة النقل والتركيب.` },
    { q: `ما هي مدة تأجير ${seedKeyword}؟`, a: `تتراوح فترات التأجير الشائعة بين أسبوع واحد و12 شهراً. تقدم الشركات خصومات للعقود الطويلة الأجل تصل إلى 20%.` },
    { q: `هل ${seedKeyword} آمن للاستخدام؟`, a: `نعم، عند استخدامه وفقاً للمعايير المهنية وشروط السلامة OSHA. يجب أن يتم التركيب بواسطة فريق معتمد وخاضع للتدريب المستمر.` },
    { q: `أين يمكنني شراء أو تأجير ${seedKeyword} في القاهرة؟`, a: `تتوفر ${seedKeyword} لدى موردين معتمدين في القاهرة، الإسكندرية، والسويس. نوصي بالمقارنة بين 3-5 عروض والتحقق من سجل الشركة.` }
  ] : [
    { q: `What is ${seedKeyword} and how is it used in construction projects?`, a: `${seedKeyword} is a specialized system used in construction projects to ensure safety and efficiency. It includes high-quality equipment and materials that comply with international ASTM and ISO standards.` },
    { q: `How much does ${seedKeyword} cost in Egypt?`, a: `${seedKeyword} costs range from 5,000 to 25,000 EGP depending on project specifications and duration required. Prices usually include transport and installation.` },
    { q: `What are the rental periods for ${seedKeyword}?`, a: `Common rental periods range from one week to 12 months. Companies offer discounts for long-term contracts up to 20%.` },
    { q: `Is ${seedKeyword} safe to use?`, a: `Yes, when used according to professional standards and OSHA safety conditions. Installation must be performed by a certified team undergoing continuous training.` },
    { q: `Where can I buy or rent ${seedKeyword} in Cairo?`, a: `${seedKeyword} is available from approved suppliers in Cairo, Alexandria, and Suez. We recommend comparing 3-5 offers and verifying the company track record.` }
  ];

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.a
      }
    }))
  };
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

  const lang = body.locale === "ar" ? "Arabic" : "English";

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const useDemo = !apiKey;

  // ── DEMO MODE: Return realistic FAQ schema when API key is missing ───────
  if (useDemo) {
    const demoSchema = generateDemoFaqSchema(seedKeyword, lang);
    return NextResponse.json({ schema: demoSchema, demo: true });
  }

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
