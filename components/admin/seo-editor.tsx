"use client";

import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { savePost, type SavePostInput } from "@/app/admin/blog/actions";
import { adminUi } from "@/lib/admin-ui";
import { slugify } from "@/lib/seo/slugs";
import { useSeoAnalyzer, type SeoAnalysis } from "@/hooks/use-seo-analyzer";

export type SeoEditorCategory = { slug: string; label: string };

export type SeoEditorInitial = {
  id?: string;
  categorySlug: string;
  seedKeyword: string;
  title: string;
  slug: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  coverImage: string | null;
  coverImageAlt: string | null;
  status: "draft" | "published";
  publishAt: string | null;
};

type Props = {
  initial: SeoEditorInitial;
  categories: SeoEditorCategory[];
  siteUrl: string;
  locale: "ar" | "en";
};

// ─── Types for Tabbed UI ───────────────────────────────────────────────────
type Tab = "editor" | "queue" | "posts" | "schema";

type KeywordQueueItem = {
  id: string;
  keyword: string;
  category: string;
  status: "pending" | "generating" | "done" | "failed";
  scheduledDate: string;
};

type SavedPost = {
  id: string;
  title: string;
  slug: string;
  categorySlug: string;
  seedKeyword: string;
  status: "draft" | "published";
  seoScore: number;
  createdAt: string;
  wordCount?: number;
};

type ImageSource = "unsplash" | "pexels";

// ─── Helper Components ─────────────────────────────────────────────────────
function ScoreCircle({ score, size = 64 }: { score: number; size?: number }) {
  const color = score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const r = size * 0.35;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e2840" strokeWidth="6" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} />
      </svg>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
        <div style={{ fontSize: size * 0.22, fontWeight: 900, color, fontFamily: "monospace" }}>{score}</div>
      </div>
    </div>
  );
}

function statusColor(status: string): string {
  if (status === "pass") return "bg-emerald-500";
  if (status === "warn") return "bg-amber-400";
  return "bg-red-400";
}

// ─── Extended SeoAnalyzer with more checks ────────────────────────────────────
function useExtendedSeoAnalyzer(
  html: string,
  seedKeyword: string,
  metaTitle: string,
  metaDescription: string,
  slug: string,
  posts: SavedPost[]
) {
  const baseAnalysis = useSeoAnalyzer({ html, seedKeyword, metaTitle, metaDescription, slug });
  
  return useMemo(() => {
    const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const words = text.split(" ").filter(Boolean);
    const wc = words.length;
    
    // Extended checks
    const extLinks = (html.match(/href=["'](https?:\/\/[^"']+)["']/g) || []).length;
    const intLinks = posts.filter(p => html.includes(p.slug)).length;
    const imgs = (html.match(/<img[^>]*>/g) || []);
    const imgsWithAlt = imgs.filter(t => t.match(/alt=["'][^"']+["']/)).length;
    
    const extendedChecks = [
      {
        id: "ext_links",
        status: extLinks >= 2 ? "pass" : extLinks >= 1 ? "warn" : "fail" as const,
        points: extLinks >= 2 ? 8 : extLinks >= 1 ? 4 : 0,
        maxPoints: 8,
      },
      {
        id: "int_links",
        status: intLinks >= 1 ? "pass" : "warn" as const,
        points: intLinks >= 1 ? 8 : 0,
        maxPoints: 8,
      },
      {
        id: "img_alt",
        status: imgs.length > 0 && imgsWithAlt === imgs.length ? "pass" : imgs.length > 0 ? "warn" : "fail" as const,
        points: imgs.length > 0 && imgsWithAlt === imgs.length ? 7 : imgs.length > 0 ? 3 : 0,
        maxPoints: 7,
      },
    ];
    
    const allChecks = [...baseAnalysis.checks, ...extendedChecks];
    const maxScore = allChecks.reduce((s, c) => s + c.maxPoints, 0);
    const earned = allChecks.reduce((s, c) => s + c.points, 0);
    const score = maxScore > 0 ? Math.min(100, Math.round((earned / maxScore) * 100)) : 0;
    
    return {
      ...baseAnalysis,
      score,
      wordCount: wc,
      checks: allChecks,
      sections: [
        { id: "basic", title: "Basic SEO", checks: allChecks.slice(0, 5), status: allChecks.slice(0, 5).every(c => c.status === "pass") ? "good" : allChecks.slice(0, 5).some(c => c.status === "fail") ? "error" : "warn" },
        { id: "additional", title: "Additional", checks: allChecks.slice(5), status: allChecks.slice(5).every(c => c.status === "pass") ? "good" : allChecks.slice(5).some(c => c.status === "fail") ? "error" : "warn" },
      ],
    };
  }, [baseAnalysis, html, posts]);
}

export function SeoEditor({ initial, categories, siteUrl, locale }: Props) {
  const t = useTranslations("adminBlog");
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState<Tab>("editor");
  
  // ── Editor state ──
  const [categorySlug, setCategorySlug] = useState(initial.categorySlug || categories[0]?.slug || "");
  const [seedKeyword, setSeedKeyword] = useState(initial.seedKeyword);
  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [slugEdited, setSlugEdited] = useState(Boolean(initial.slug));
  const [metaTitle, setMetaTitle] = useState(initial.metaTitle);
  const [metaDescription, setMetaDescription] = useState(initial.metaDescription);
  const [coverImage, setCoverImage] = useState<string | null>(initial.coverImage);
  const [coverImageAlt, setCoverImageAlt] = useState<string | null>(initial.coverImageAlt);
  const [publishAt, setPublishAt] = useState<string>(initial.publishAt?.slice(0, 16) ?? "");
  const [html, setHtml] = useState(initial.content);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  
  // ── Image picker state ──
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageSource, setImageSource] = useState<ImageSource>("unsplash");
  const [imageSearchQuery, setImageSearchQuery] = useState("");
  const [fetchingImages, setFetchingImages] = useState(false);
  
  // ── Queue state ──
  const [queue, setQueue] = useState<KeywordQueueItem[]>([]);
  const [bulkKeywords, setBulkKeywords] = useState("");
  const [queueRunning, setQueueRunning] = useState(false);
  
  // ── Posts state ──
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  
  // ── Schema state ──
  const [activeSchema, setActiveSchema] = useState<"article" | "faq" | "breadcrumb">("article");
  const [faqSchema, setFaqSchema] = useState<string>("");
  
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ inline: false }),
    ],
    content: initial.content,
    onUpdate: ({ editor: ed }) => setHtml(ed.getHTML()),
    editorProps: {
      attributes: { class: "prose-blog min-h-[24rem] focus:outline-none" },
    },
  });

  const analysis = useExtendedSeoAnalyzer(html, seedKeyword, metaTitle, metaDescription, slug, savedPosts);

  const onTitleChange = (value: string) => {
    setTitle(value);
    if (!slugEdited) setSlug(slugify(value));
  };

  // ── Image handling ──
  const insertImageFromFile = useCallback(
    async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      form.append("seedKeyword", seedKeyword);
      const res = await fetch("/api/upload-seo-image", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: data.error ?? "Upload failed" });
        return;
      }
      editor?.chain().focus().setImage({ src: data.url, alt: data.alt }).run();
    },
    [editor, seedKeyword],
  );

  const fetchExternalImage = async () => {
    if (!imageSearchQuery.trim()) return;
    setFetchingImages(true);
    try {
      const res = await fetch("/api/fetch-external-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: imageSearchQuery, 
          source: imageSource,
          altText: seedKeyword || imageSearchQuery
        }),
      });
      const data = await res.json();
      if (res.ok) {
        editor?.chain().focus().setImage({ src: data.url, alt: data.alt }).run();
        setShowImageModal(false);
        setMessage({ type: "ok", text: `Image inserted from ${data.source}` });
      } else {
        setMessage({ type: "err", text: data.error ?? "Failed to fetch image" });
      }
    } finally {
      setFetchingImages(false);
    }
  };

  const handleGenerate = async () => {
    if (!seedKeyword.trim()) {
      setMessage({ type: "err", text: t("needKeyword") });
      return;
    }
    setGenerating(true);
    setMessage(null);
    try {
      const res = await fetch("/api/generate-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seedKeyword, category: categorySlug, locale }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: data.error ?? "Generation failed" });
        return;
      }
      editor?.commands.setContent(data.content);
      setHtml(data.content);
      setMetaTitle(data.metaTitle);
      setMetaDescription(data.metaDescription);
      if (!title) onTitleChange(data.metaTitle);
      setMessage({ type: "ok", text: t("generated") });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async (status: "draft" | "published") => {
    setSaving(true);
    setMessage(null);
    const payload: SavePostInput = {
      id: initial.id,
      categorySlug,
      seedKeyword,
      title,
      slug,
      content: html,
      metaTitle,
      metaDescription,
      coverImage,
      coverImageAlt,
      seoScore: analysis.score,
      status,
      publishAt: publishAt ? new Date(publishAt).toISOString() : null,
    };
    const result = await savePost(payload);
    setSaving(false);
    if (!result.ok) {
      setMessage({ type: "err", text: result.error });
      return;
    }
    setMessage({ type: "ok", text: t("saved") });
    // Add to saved posts list
    const newPost: SavedPost = {
      id: initial.id || String(Date.now()),
      title,
      slug,
      categorySlug,
      seedKeyword,
      status,
      seoScore: analysis.score,
      createdAt: new Date().toISOString(),
      wordCount: analysis.wordCount,
    };
    setSavedPosts(prev => {
      const exists = prev.find(p => p.id === newPost.id);
      if (exists) return prev.map(p => p.id === newPost.id ? newPost : p);
      return [...prev, newPost];
    });
    router.push("/admin/blog");
    router.refresh();
  };

  const setLink = () => {
    const url = window.prompt(t("linkPrompt"));
    if (url === null) return;
    if (url === "") {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  // ── Queue functions ──
  const addToQueue = () => {
    const lines = bulkKeywords.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    const newItems: KeywordQueueItem[] = lines.map((kw, i) => ({
      id: `${Date.now()}-${i}`,
      keyword: kw,
      category: categorySlug,
      status: "pending",
      scheduledDate: new Date(Date.now() + i * 86400000).toISOString().split("T")[0],
    }));
    setQueue(prev => [...prev, ...newItems]);
    setBulkKeywords("");
  };

  const runQueue = async () => {
    const pending = queue.filter(k => k.status === "pending");
    if (pending.length === 0 || queueRunning) return;
    setQueueRunning(true);
    
    for (const item of pending) {
      setQueue(prev => prev.map(k => k.id === item.id ? { ...k, status: "generating" } : k));
      try {
        // Generate article
        const res = await fetch("/api/generate-article", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seedKeyword: item.keyword, category: item.category, locale }),
        });
        if (res.ok) {
          setQueue(prev => prev.map(k => k.id === item.id ? { ...k, status: "done" } : k));
        } else {
          setQueue(prev => prev.map(k => k.id === item.id ? { ...k, status: "failed" } : k));
        }
      } catch {
        setQueue(prev => prev.map(k => k.id === item.id ? { ...k, status: "failed" } : k));
      }
      await new Promise(r => setTimeout(r, 3000)); // Rate limit
    }
    setQueueRunning(false);
  };

  // ── Generate JSON-LD Schema ──
  const generateSchema = () => {
    const schemas: Record<string, unknown> = {
      article: {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: metaTitle || title,
        description: metaDescription,
        url: `${siteUrl}/${categorySlug}/${slug}`,
        datePublished: new Date().toISOString(),
        author: { "@type": "Organization", name: "Construction Egy" },
        wordCount: analysis.wordCount,
        articleSection: categories.find(c => c.slug === categorySlug)?.label || "Blog",
      },
      breadcrumb: {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: categories.find(c => c.slug === categorySlug)?.label || "Blog", item: `${siteUrl}/${categorySlug}` },
          { "@type": "ListItem", position: 3, name: metaTitle || title },
        ],
      },
    };
    return JSON.stringify(schemas[activeSchema], null, 2);
  };

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-8rem)]">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-[var(--admin-cell-border)] bg-[var(--admin-zebra-odd)] px-4">
        {[
          { id: "editor" as Tab, icon: "✏️", label: "Editor" },
          { id: "queue" as Tab, icon: "📅", label: `Queue (${queue.filter(k => k.status === "pending").length})` },
          { id: "posts" as Tab, icon: "📚", label: `Posts (${savedPosts.length})` },
          { id: "schema" as Tab, icon: "⚡", label: "Schema" },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === t.id 
                ? "border-blue-500 text-blue-600 bg-white/5" 
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
        {message && (
          <div className={`ml-auto text-sm px-3 py-1 rounded ${message.type === "ok" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {message.text}
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "editor" && (
          <div className="grid lg:grid-cols-[1fr_20rem] h-full">
            {/* Editor Main */}
            <div className="flex flex-col gap-4 p-4 overflow-y-auto">

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className={adminUi.label}>{t("category")}</span>
            <select
              className={adminUi.input}
              onChange={(e) => setCategorySlug(e.target.value)}
              value={categorySlug}
            >
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={adminUi.label}>{t("seedKeyword")}</span>
            <input
              className={adminUi.input}
              onChange={(e) => setSeedKeyword(e.target.value)}
              placeholder={t("seedKeywordPlaceholder")}
              value={seedKeyword}
            />
          </label>
        </div>

        <button className={adminUi.btnPrimary} disabled={generating} onClick={handleGenerate} type="button">
          {generating ? t("generating") : t("generateWithAi")}
        </button>

        <label className="flex flex-col gap-1">
          <span className={adminUi.label}>{t("postTitle")}</span>
          <input className={adminUi.input} onChange={(e) => onTitleChange(e.target.value)} value={title} />
        </label>

        <label className="flex flex-col gap-1">
          <span className={adminUi.label}>{t("slug")}</span>
          <input
            className={adminUi.inputMono}
            onChange={(e) => {
              setSlug(slugify(e.target.value));
              setSlugEdited(true);
            }}
            value={slug}
          />
          <span className={adminUi.footnote}>
            /{categorySlug}/{slug || "..."}
          </span>
        </label>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-1.5 rounded-sm border border-[var(--admin-cell-border)] bg-[var(--admin-zebra-odd)] p-2">
          <ToolbarBtn active={editor?.isActive("bold")} onClick={() => editor?.chain().focus().toggleBold().run()}>B</ToolbarBtn>
          <ToolbarBtn active={editor?.isActive("italic")} onClick={() => editor?.chain().focus().toggleItalic().run()}>i</ToolbarBtn>
          <ToolbarBtn active={editor?.isActive("heading", { level: 2 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>H2</ToolbarBtn>
          <ToolbarBtn active={editor?.isActive("heading", { level: 3 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>H3</ToolbarBtn>
          <ToolbarBtn active={editor?.isActive("bulletList")} onClick={() => editor?.chain().focus().toggleBulletList().run()}>• List</ToolbarBtn>
          <ToolbarBtn active={editor?.isActive("orderedList")} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>1. List</ToolbarBtn>
          <ToolbarBtn active={editor?.isActive("link")} onClick={setLink}>🔗</ToolbarBtn>
          <ToolbarBtn onClick={() => setShowImageModal(true)}>🖼️</ToolbarBtn>
          <input
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void insertImageFromFile(f);
              e.target.value = "";
            }}
            ref={fileInputRef}
            type="file"
          />
        </div>

        <div
          className="rounded-sm border border-[var(--admin-cell-border)] bg-white p-4"
          onDrop={(e) => {
            const f = e.dataTransfer.files?.[0];
            if (f && f.type.startsWith("image/")) {
              e.preventDefault();
              void insertImageFromFile(f);
            }
          }}
        >
          <EditorContent editor={editor} />
        </div>

        {/* Meta */}
        <label className="flex flex-col gap-1">
          <span className={adminUi.label}>
            {t("metaTitle")} <span className={adminUi.footnote}>({metaTitle.length}/60)</span>
          </span>
          <input className={adminUi.input} onChange={(e) => setMetaTitle(e.target.value)} value={metaTitle} />
        </label>
        <label className="flex flex-col gap-1">
          <span className={adminUi.label}>
            {t("metaDescription")} <span className={adminUi.footnote}>({metaDescription.length}/160)</span>
          </span>
          <textarea
            className={adminUi.input}
            onChange={(e) => setMetaDescription(e.target.value)}
            rows={3}
            value={metaDescription}
          />
        </label>

        {/* Cover image */}
        <div className="flex flex-col gap-2">
          <span className={adminUi.label}>{t("coverImage")}</span>
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={coverImageAlt ?? ""} className="max-h-40 rounded-sm" src={coverImage} />
          ) : null}
          <input
            accept="image/*"
            className="text-sm"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const form = new FormData();
              form.append("file", f);
              form.append("seedKeyword", seedKeyword);
              const res = await fetch("/api/upload-seo-image", { method: "POST", body: form });
              const data = await res.json();
              if (res.ok) {
                setCoverImage(data.url);
                setCoverImageAlt(data.alt);
              } else {
                setMessage({ type: "err", text: data.error ?? "Upload failed" });
              }
              e.target.value = "";
            }}
            type="file"
          />
          {coverImage ? (
            <input
              className={adminUi.input}
              onChange={(e) => setCoverImageAlt(e.target.value)}
              placeholder={t("coverAlt")}
              value={coverImageAlt ?? ""}
            />
          ) : null}
        </div>

        <label className="flex flex-col gap-1">
          <span className={adminUi.label}>{t("scheduleAt")}</span>
          <input
            className={adminUi.input}
            onChange={(e) => setPublishAt(e.target.value)}
            type="datetime-local"
            value={publishAt}
          />
          <span className={adminUi.footnote}>{t("scheduleHint")}</span>
        </label>

        <div className="flex flex-wrap gap-2">
          <button className={adminUi.btnSecondary} disabled={saving} onClick={() => handleSave("draft")} type="button">
            {t("saveDraft")}
          </button>
          <button className={adminUi.btnPrimary} disabled={saving} onClick={() => handleSave("published")} type="button">
            {publishAt ? t("schedule") : t("publish")}
          </button>
        </div>
      </div>

            {/* SEO Sidebar */}
            <aside className="flex flex-col gap-4 p-4 bg-[#f8fafc] border-l border-[var(--admin-cell-border)] overflow-y-auto">
              {/* Score Circle */}
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl p-4 text-white">
                <div className="flex items-center gap-3">
                  <ScoreCircle score={analysis.score} size={64} />
                  <div>
                    <div className="text-2xl font-bold">SEO Score</div>
                    <div className="text-sm opacity-90">{analysis.wordCount} words</div>
                  </div>
                </div>
              </div>

              {/* SEO Analysis Sections */}
              <div className="flex flex-col gap-3">
                {analysis.sections?.map(section => (
                  <div key={section.id} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">{section.title}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        section.status === "good" ? "bg-green-100 text-green-700" :
                        section.status === "warn" ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>{section.status === "good" ? "Good" : section.status === "warn" ? "Improve" : "Errors"}</span>
                    </div>
                    <div className="space-y-1">
                      {section.checks.map(check => (
                        <div key={check.id} className="flex items-center gap-2 text-xs">
                          <span className={`w-2 h-2 rounded-full ${statusColor(check.status)}`} />
                          <span className="flex-1 text-gray-600">{check.id.replace(/_/g, " ")}</span>
                          <span className="text-gray-400">{check.points}/{check.maxPoints}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        )}

        {activeTab === "queue" && (
          <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Keyword Queue</h2>
              <button 
                onClick={runQueue}
                disabled={queueRunning || queue.filter(k => k.status === "pending").length === 0}
                className={`px-4 py-2 rounded-lg font-medium text-white ${
                  queueRunning ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {queueRunning ? "Processing..." : `Generate ${queue.filter(k => k.status === "pending").length} Pending`}
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4">
              <div className="p-4 border-b border-gray-100">
                <label className="block text-sm font-medium mb-2">Add Keywords (one per line or comma-separated)</label>
                <textarea
                  value={bulkKeywords}
                  onChange={(e) => setBulkKeywords(e.target.value)}
                  className="w-full h-24 p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="construction equipment&#10;heavy machinery&#10;excavators"
                />
                <button 
                  onClick={addToQueue}
                  disabled={!bulkKeywords.trim()}
                  className="mt-2 px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-900 disabled:opacity-50"
                >
                  Add to Queue
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Keyword</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Category</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Scheduled</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500">No keywords in queue. Add some above!</td>
                    </tr>
                  ) : (
                    queue.map((item) => (
                      <tr key={item.id} className="border-t border-gray-100">
                        <td className="px-4 py-3 font-medium">{item.keyword}</td>
                        <td className="px-4 py-3 text-gray-600">{item.category}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            item.status === "done" ? "bg-green-100 text-green-700" :
                            item.status === "generating" ? "bg-blue-100 text-blue-700" :
                            item.status === "failed" ? "bg-red-100 text-red-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            {item.status === "done" ? "✓" : item.status === "generating" ? "⏳" : item.status === "failed" ? "✗" : "○"}
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{item.scheduledDate}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "posts" && (
          <div className="p-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">All Posts</h2>
              <div className="flex gap-2">
                <select 
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => (
                    <option key={c.slug} value={c.slug}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Title</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Category</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">SEO Score</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Words</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {savedPosts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No posts yet. Create your first post in the Editor tab!</td>
                    </tr>
                  ) : (
                    savedPosts
                      .filter(p => filterCategory === "all" || p.categorySlug === filterCategory)
                      .map(post => (
                        <tr key={post.id} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium">{post.title}</div>
                            <div className="text-xs text-gray-500">/{post.categorySlug}/{post.slug}</div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{post.categorySlug}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              post.seoScore >= 80 ? "bg-green-100 text-green-700" :
                              post.seoScore >= 50 ? "bg-yellow-100 text-yellow-700" :
                              "bg-red-100 text-red-700"
                            }`}>
                              <ScoreCircle score={post.seoScore} size={16} />
                              {post.seoScore}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{post.wordCount || "-"}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              post.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                            }`}>
                              {post.status}
                            </span>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "schema" && (
          <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-4">JSON-LD Schema Generator</h2>
              <div className="flex gap-2 mb-4">
                {[
                  { id: "article", label: "Article", icon: "📝" },
                  { id: "breadcrumb", label: "Breadcrumb", icon: "🧭" },
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSchema(s.id as typeof activeSchema)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeSchema === s.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>

              <div className="bg-gray-900 rounded-xl p-4 font-mono text-sm text-green-400 overflow-auto max-h-[500px]">
                <pre>{generateSchema()}</pre>
              </div>

              <p className="mt-4 text-sm text-gray-600">
                This schema will be automatically injected into your post's HTML when published. 
                It helps search engines understand your content structure for rich snippets.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">Insert Image</h3>
            
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setImageSource("unsplash")}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${
                  imageSource === "unsplash" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
                }`}
              >
                Unsplash
              </button>
              <button
                onClick={() => setImageSource("pexels")}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${
                  imageSource === "pexels" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
                }`}
              >
                Pexels
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Search {imageSource === "pexels" ? "Pexels" : "Unsplash"} for:
              </label>
              <input
                type="text"
                value={imageSearchQuery}
                onChange={(e) => setImageSearchQuery(e.target.value)}
                placeholder="construction machinery, tools, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={fetchExternalImage}
                disabled={fetchingImages || !imageSearchQuery.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {fetchingImages ? "Fetching..." : "Fetch & Insert"}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Upload File
              </button>
              <button
                onClick={() => setShowImageModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolbarBtn({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={active ? adminUi.btnPrimary : adminUi.btnGhost}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
