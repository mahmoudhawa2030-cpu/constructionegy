"use client";

import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";

import { savePost, type SavePostInput } from "@/app/admin/blog/actions";
import { adminUi } from "@/lib/admin-ui";
import { slugify } from "@/lib/seo/slugs";
import { useSeoAnalyzer } from "@/hooks/use-seo-analyzer";

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

const CHECK_LABELS: Record<string, { ar: string; en: string }> = {
  wordCount: { ar: "عدد الكلمات ≥ 1500", en: "Word count ≥ 1500" },
  keywordInIntro: { ar: "الكلمة المفتاحية في المقدمة", en: "Keyword in introduction" },
  metaTitle: { ar: "عنوان ميتا (≤60 + الكلمة)", en: "Meta title (≤60 + keyword)" },
  metaDescription: { ar: "وصف ميتا (≤160 + الكلمة)", en: "Meta description (≤160 + keyword)" },
  externalLink: { ar: "رابط خارجي واحد على الأقل", en: "At least one external link" },
  internalLink: { ar: "رابط داخلي واحد على الأقل", en: "At least one internal link" },
  imageAlt: { ar: "نص بديل لكل الصور", en: "All images have alt text" },
  slugKeyword: { ar: "الرابط يحتوي الكلمة المفتاحية", en: "Slug contains keyword" },
};

function statusColor(status: string): string {
  if (status === "pass") return "bg-emerald-500";
  if (status === "warn") return "bg-amber-400";
  return "bg-red-400";
}

export function SeoEditor({ initial, categories, siteUrl, locale }: Props) {
  const t = useTranslations("adminBlog");
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const analysis = useSeoAnalyzer({
    html,
    seedKeyword,
    metaTitle,
    metaDescription,
    slug,
    siteUrl,
  });

  const onTitleChange = (value: string) => {
    setTitle(value);
    if (!slugEdited) setSlug(slugify(value));
  };

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

  const scoreColor = useMemo(() => {
    if (analysis.score >= 80) return "text-emerald-600";
    if (analysis.score >= 50) return "text-amber-600";
    return "text-red-600";
  }, [analysis.score]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      {/* Main column */}
      <div className="flex flex-col gap-4">
        {message ? (
          <div className={message.type === "ok" ? adminUi.messageStripInfo : adminUi.messageStripWarn}>
            {message.text}
          </div>
        ) : null}

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
          <ToolbarBtn active={editor?.isActive("link")} onClick={setLink}>{t("link")}</ToolbarBtn>
          <ToolbarBtn onClick={() => fileInputRef.current?.click()}>{t("image")}</ToolbarBtn>
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

      {/* SEO sidebar */}
      <aside className="flex flex-col gap-3">
        <div className={adminUi.cardPadded}>
          <div className="flex items-center justify-between">
            <span className={adminUi.label}>{t("seoScore")}</span>
            <span className={`text-2xl font-bold tabular-nums ${scoreColor}`}>{analysis.score}</span>
          </div>
          <div className="mt-1 text-xs text-[var(--admin-text-secondary)]">
            {t("words")}: <span className="tabular-nums">{analysis.wordCount}</span>
          </div>
          <ul className="mt-3 flex flex-col gap-2">
            {analysis.checks.map((c) => (
              <li key={c.id} className="flex items-center gap-2 text-sm">
                <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${statusColor(c.status)}`} />
                <span className="text-[var(--admin-text)]">
                  {CHECK_LABELS[c.id]?.[locale] ?? c.id}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
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
