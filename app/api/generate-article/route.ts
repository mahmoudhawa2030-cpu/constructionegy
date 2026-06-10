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

// ─────────────────────────────────────────────────────────────────────────
// DEMO MODE: Generates realistic content when Anthropic API is unavailable
// ─────────────────────────────────────────────────────────────────────────
function generateDemoContent(seedKeyword: string, category: string, locale: "ar" | "en") {
  const isAr = locale === "ar";
  const keywordLower = seedKeyword.toLowerCase();
  const categoryText = category || "construction";

  // Power words and CTA words for realistic titles/descriptions
  const powerWords = ["Complete", "Ultimate", "Essential", "Proven", "Expert"];
  const powerWord = powerWords[Math.floor(Math.random() * powerWords.length)];

  // Generate meta title (52-59 chars)
  const metaTitle = isAr
    ? `${powerWord} دليل ${seedKeyword} في مصر 2024`.slice(0, 60)
    : `${powerWord} Guide to ${seedKeyword} in Egypt 2024`.slice(0, 60);

  // Generate meta description (130-155 chars)
  const ctaWords = ["Discover", "Learn", "Explore", "Find"];
  const cta = ctaWords[Math.floor(Math.random() * ctaWords.length)];
  const metaDescription = isAr
    ? `${cta} أفضل نصائح ${seedKeyword} للمقاولين في مصر. دليل شامل 2024 يغطي الأسعار والمواصفات.`.slice(0, 160)
    : `${cta} the best ${seedKeyword} strategies for contractors in Egypt. Complete 2024 guide covering pricing and specs.`.slice(0, 160);

  // Introduction paragraphs with keyword in first 80 words
  const introParagraphs = isAr ? [
    `يعد ${seedKeyword} من أهم العوامل التي تؤثر على نجاح المشاريع الإنشائية في مصر. سواء كنت مقاولًا كبيرًا أو مدير مشروع، فإن فهم جميع جوانب ${seedKeyword} أمر ضروري لتحقيق النتائج المثلى.`,
    `في هذا الدليل الشامل، سنغطي كل ما تحتاج لمعرفته حول ${seedKeyword}، من الأساسيات إلى المتقدمة وأفضل الممارسات المعتمدة في السوق المصري.`
  ] : [
    `${seedKeyword} is one of the most critical factors affecting construction project success in Egypt. Whether you're a large contractor or project manager, understanding all aspects of ${seedKeyword} is essential for optimal results.`,
    `In this comprehensive guide, we cover everything you need to know about ${seedKeyword}, from basic principles to advanced strategies approved in the Egyptian market.`
  ];

  // Main content sections with h2 every 250-300 words
  const sections = isAr ? [
    { h2: `ما هو ${seedKeyword}؟`, p: `يشير ${seedKeyword} إلى المجموعة الكاملة من العمليات والمواد المستخدمة في المشاريع الإنشائية الحديثة. وفقاً لإحصائيات وزارة الإسكان المصرية، تشهد هذه الصناعة نمواً سنوياً مركباً يبلغ 12% منذ 2021.`, h3: "التعريف الأساسي", p2: "يضمن التطبيق السليم للمعايير الهندسية سلامة المباني وكفاءتها على المدى الطويل." },
    { h2: `أهمية ${seedKeyword} للمقاولين`, p: `توفر ${seedKeyword} حلولاً فعالة من حيث التكلفة للشركات الإنشائية. تشير دراسة مجلس البناء الأمريكي 2023 إلى أن المشاريع التي تستخدم ${seedKeyword} بشكل صحيح تقلل الميزانيات بنسبة 15-20%.`, h3: "فوائد استخدام", p2: "تشمل الفوائد الرئيسية: تقليل الوقت، تحسين الجودة، والامتثال للمعايير الدولية ASTM و ISO." },
    { h2: `أنواع ${seedKeyword} المتاحة`, p: `تتوفر أنواع متعددة من ${seedKeyword} في السوق المصري لتناسب مختلف احتياجات المشاريع. يتراوح السعر بين 5000 و 25000 جنيه مصري حسب المواصفات.`, h3: "الأنواع الشائعة", p2: "تشمل الأنواع الرئيسية: النظام القياسي، النظام المتقدم، والحلول المخصصة للمشاريع الكبرى." },
    { h2: `معايير الجودة والمواصفات الفنية`, p: `يجب أن تتوافق جميع منتجات ${seedKeyword} مع معايير الجودة المصرية والدولية. تشمل المواصفات الأساسية: المتانة، مقاومة العوامل الجوية، وسهولة التركيب.`, h3: "الشهادات المطلوبة", p2: "ابحث عن شهادات ISO 9001، CE Marking، وموافقة الهيئة المصرية العامة للمواصفات والجودة." },
    { h2: `نصائح لاختيار أفضل ${seedKeyword}`, p: `عند اختيار مورد لـ ${seedKeyword}، فكر في: خبرة الشركة، سجل الأداء، دعم ما بعد البيع، والضمانات المقدمة.`, h3: "معايير التقييم", p2: "نوصي بمقارنة 3-5 موردين على الأقل، والتحقق من مشاريعهم السابقة في مصر." },
    { h2: `التكلفة والميزانية المتوقعة`, p: `تختلف تكلفة ${seedKeyword} حسب حجم المشروع والمواصفات المطلوبة. يتراوح متوسط السعر في القاهرة والإسكندرية بين 8000 و 18000 جنيه للوحدة.`, h3: "عوامل التسعير", p2: "تشمل: المساحة، الارتفاع، فترة الإيجار/الشراء، والخدمات الإضافية مثل النقل والتركيب." },
    { h2: `أفضل ممارسات السلامة`, p: `تعتبر السلامة الأولوية القصوى عند استخدام ${seedKeyword}. يجب أن تلتزم جميع العمليات بمعايير OSHA Egypt.`, h3: "تدريب العمال", p2: "تأكد من أن جميع العمال المشاركين حاصلين على شهادات السلامة المهنية المعتمدة." }
  ] : [
    { h2: `What is ${seedKeyword}?`, p: `${seedKeyword} refers to the complete range of processes and materials used in modern construction projects. According to Egyptian Ministry of Housing statistics, this industry has seen a compound annual growth rate of 12% since 2021.`, h3: "Basic Definition", p2: "Proper application of engineering standards ensures building safety and long-term efficiency." },
    { h2: `Why ${seedKeyword} Matters for Contractors`, p: `${seedKeyword} provides cost-effective solutions for construction companies. A 2023 Associated Builders and Contractors study shows projects using ${seedKeyword} correctly reduce budgets by 15-20%.`, h3: "Key Benefits", p2: "Main advantages include: reduced timelines, improved quality, and compliance with international ASTM and ISO standards." },
    { h2: `Types of ${seedKeyword} Available`, p: `Multiple types of ${seedKeyword} are available in the Egyptian market to suit different project needs. Prices range from 5,000 to 25,000 EGP depending on specifications.`, h3: "Common Varieties", p2: "Main types include: Standard systems, Advanced systems, and custom solutions for major projects." },
    { h2: `Quality Standards and Technical Specifications`, p: `All ${seedKeyword} products must comply with Egyptian and international quality standards. Key specifications include: durability, weather resistance, and ease of installation.`, h3: "Required Certifications", p2: "Look for ISO 9001, CE Marking, and Egyptian General Authority for Standards and Quality approval." },
    { h2: `Tips for Choosing the Best ${seedKeyword}`, p: `When selecting a ${seedKeyword} supplier, consider: company experience, track record, after-sales support, and warranties provided.`, h3: "Evaluation Criteria", p2: "We recommend comparing at least 3-5 suppliers and verifying their previous projects in Egypt." },
    { h2: `Cost and Budget Planning`, p: `${seedKeyword} costs vary by project size and specifications. Average prices in Cairo and Alexandria range from 8,000 to 18,000 EGP per unit.`, h3: "Pricing Factors", p2: "Include: area, height, rental/purchase period, and additional services like transport and installation." },
    { h2: `Safety Best Practices`, p: `Safety is the top priority when using ${seedKeyword}. All operations must comply with OSHA Egypt standards.`, h3: "Worker Training", p2: "Ensure all participating workers hold certified professional safety certificates." }
  ];

  const ctaSection = isAr ? {
    h2: `تواصل معنا لـ ${seedKeyword}`,
    p: `هل تبحث عن ${seedKeyword} موثوقة لمشروعك القادم؟ فريقنا من الخبراء جاهز لمساعدتك. <a href="/contact">اتصل بنا اليوم</a> للحصول على استشارة مجانية.`
  } : {
    h2: `Contact Us for ${seedKeyword}`,
    p: `Looking for reliable ${seedKeyword} for your next project? Our team of experts is ready to help. <a href="/contact">Contact us today</a> for a free consultation.`
  };

  // Build HTML content
  let html = `<h1>${metaTitle}</h1>\n\n`;

  introParagraphs.forEach(p => {
    html += `<p>${p}</p>\n\n`;
  });

  // Internal and external links
  html += `<p>${isAr ? 'لمزيد من المعلومات، راجع' : 'For more information, see'} <a href="/${categoryText}">${isAr ? 'مقالات ذات صلة' : 'Related articles'}</a> ${isAr ? 'وكذلك' : 'and'} <a href="https://www.astm.org" target="_blank" rel="noopener">ASTM International</a> ${isAr ? 'و' : 'and'} <a href="https://www.iso.org" target="_blank" rel="noopener">ISO Standards</a>.</p>\n\n`;

  // Main sections
  sections.forEach((section, idx) => {
    html += `<h2>${section.h2}</h2>\n\n`;
    html += `<p>${section.p}</p>\n\n`;
    if (section.h3) {
      html += `<h3>${section.h3}</h3>\n\n`;
      html += `<p>${section.p2}</p>\n\n`;
    }
    if (idx === 2 || idx === 4) {
      const items = isAr
        ? ['معايير الجودة العالية', 'الأسعار التنافسية', 'الدعم الفني المستمر', 'التوصيل السريع']
        : ['High quality standards', 'Competitive pricing', 'Ongoing technical support', 'Fast delivery'];
      html += `<ul>\n${items.map(item => `  <li>${item}</li>`).join('\n')}\n</ul>\n\n`;
    }
  });

  html += `<h2>${ctaSection.h2}</h2>\n\n`;
  html += `<p>${ctaSection.p}</p>\n\n`;

  html += `<p><strong>${isAr ? 'إحصائيات:' : 'Key Statistics:'}</strong> ${isAr
    ? `وفقاً لـ ENR 2023، تم تنفيذ مشاريع بقيمة 45 مليار دولار في مصر. %65 منها استخدمت ${seedKeyword} بشكل فعال.`
    : `According to ENR 2023, projects worth $45 billion were executed in Egypt. 65% used ${seedKeyword} effectively.`
  }</p>\n\n`;

  html += `<p>${isAr
    ? 'المصادر: <a href="https://www.enr.com" target="_blank" rel="noopener">Engineering News-Record</a>، <a href="https://www.abc.org" target="_blank" rel="noopener">ABC</a>.'
    : 'Sources: <a href="https://www.enr.com" target="_blank" rel="noopener">Engineering News-Record</a>, <a href="https://www.abc.org" target="_blank" rel="noopener">ABC</a>.'
  }</p>`;

  const slug = metaTitle.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

  return {
    content: html,
    metaTitle,
    metaDescription,
    slug: slug || slugify(seedKeyword),
    demo: true
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

  let body: GenerateBody;
  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const seedKeyword = (body.seedKeyword ?? "").trim();
  const category = (body.category ?? "").trim();
  const locale: "ar" | "en" = body.locale === "ar" ? "ar" : "en";

  if (!seedKeyword)
    return NextResponse.json({ error: "seedKeyword is required" }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const useDemo = !apiKey;

  // ── DEMO MODE: Return realistic mock content when API key is missing ────
  if (useDemo) {
    const demo = generateDemoContent(seedKeyword, category, locale);
    return NextResponse.json(demo);
  }
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
