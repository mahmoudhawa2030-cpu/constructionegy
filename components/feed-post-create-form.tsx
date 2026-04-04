"use client";

import type { EmojiClickData } from "emoji-picker-react";
import { Theme } from "emoji-picker-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

import type { CreateFeedPostState } from "@/lib/feed/post-actions";
import {
  isAllowedFeedImageFile,
  uploadFeedPostImagesFromBrowser,
} from "@/lib/feed/upload-feed-post-images-client";

const EmojiPicker = dynamic(
  () => import("emoji-picker-react").then((mod) => mod.default),
  {
    loading: () => (
      <p className="p-3 text-center text-xs text-[var(--bina-muted)]">…</p>
    ),
    ssr: false,
  },
);

const MAX_PHOTOS = 9;

type LocalPhoto = { id: string; file: File; previewUrl: string };

type Props = {
  defaultLocation?: string | null;
};

function insertAtCursor(textarea: HTMLTextAreaElement, text: string) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;
  const next = value.slice(0, start) + text + value.slice(end);
  textarea.value = next;
  const pos = start + text.length;
  textarea.selectionStart = textarea.selectionEnd = pos;
  textarea.focus();
}

export function FeedPostCreateForm({ defaultLocation }: Props) {
  const t = useTranslations("feedPost");
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiWrapRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<CreateFeedPostState | null>(null);
  const [attachments, setAttachments] = useState<LocalPhoto[]>([]);
  const [clientError, setClientError] = useState<string | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const attachmentsRef = useRef(attachments);
  attachmentsRef.current = attachments;
  useEffect(() => {
    return () => {
      for (const a of attachmentsRef.current) {
        URL.revokeObjectURL(a.previewUrl);
      }
    };
  }, []);

  useEffect(() => {
    if (!emojiOpen) return;
    const onDocMouseDown = (ev: MouseEvent) => {
      if (!emojiWrapRef.current?.contains(ev.target as Node)) {
        setEmojiOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [emojiOpen]);

  const fieldErrors = state?.ok === false ? state.fieldErrors : undefined;
  const formError = state?.ok === false ? state.formError : undefined;

  const pickerTheme = resolvedTheme === "dark" ? Theme.DARK : Theme.LIGHT;

  function onEmojiPick(data: EmojiClickData) {
    const ta = bodyRef.current;
    if (!ta) return;
    insertAtCursor(ta, data.emoji);
    setEmojiOpen(false);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setClientError(null);
    const list = e.target.files;
    e.target.value = "";
    if (!list?.length) return;

    const incoming = Array.from(list);
    const next = [...attachments];
    for (const file of incoming) {
      if (next.length >= MAX_PHOTOS) break;
      if (!isAllowedFeedImageFile(file)) {
        const allowedType = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type);
        setClientError(allowedType ? t("imageTooLarge") : t("imageTypeInvalid"));
        return;
      }
      next.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }
    setAttachments(next);
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found) URL.revokeObjectURL(found.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setClientError(null);
    const formEl = e.currentTarget;
    let urls: string[] = [];
    if (attachments.length > 0) {
      setUploading(true);
      try {
        urls = await uploadFeedPostImagesFromBrowser(attachments.map((a) => a.file));
      } catch (err) {
        setUploading(false);
        const code = err instanceof Error ? err.message : "";
        if (code === "type") setClientError(t("imageTypeInvalid"));
        else if (code === "size") setClientError(t("imageTooLarge"));
        else if (code === "auth") setClientError(t("errors.unauthorized"));
        else setClientError(t("uploadFailed"));
        return;
      }
      setUploading(false);
    }

    const fd = new FormData(formEl);
    const body = String(fd.get("body") ?? "");
    const location = String(fd.get("location") ?? "");

    setSubmitting(true);
    try {
      const res = await fetch("/api/feed/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, location, imageUrls: urls }),
      });

      let next: CreateFeedPostState;
      if (res.ok) {
        const json = await res.json();
        next = { ok: true, id: json.id };
      } else {
        const json = await res.json().catch(() => ({}));
        next = { ok: false, formError: json.error || "saveFailed" };
      }
      setState(next);
      if (next.ok === true) {
        router.push(`/posts/${next.id}`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const busy = submitting || uploading;

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      {formError ? (
        <p className="rounded-lg border border-[var(--bina-red)]/40 bg-[var(--bina-red)]/10 px-3 py-2 font-bina-display text-xs text-[var(--bina-red)]">
          {formError}
        </p>
      ) : null}
      {clientError ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 font-bina-display text-xs text-amber-200">
          {clientError}
        </p>
      ) : null}

      <label className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-bina-display text-[11px] font-semibold uppercase tracking-wide text-[var(--bina-muted)]">
            {t("bodyLabel")}
          </span>
          <div ref={emojiWrapRef} className="relative">
            <button
              aria-expanded={emojiOpen}
              aria-label={t("emojiButtonAria")}
              className="rounded-[var(--bina-r)] border border-[var(--bina-border)] bg-[var(--bina-steel3)] px-2 py-1 font-bina-display text-sm text-[var(--bina-text)] transition-colors hover:bg-[var(--bina-steel4)]"
              type="button"
              onClick={() => setEmojiOpen((v) => !v)}
            >
              😊
            </button>
            {emojiOpen ? (
              <div
                className="absolute end-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] max-h-[min(50vh,320px)] overflow-hidden rounded-xl border border-[var(--bina-border)] shadow-xl"
                onMouseDown={(evt) => evt.preventDefault()}
                role="presentation"
              >
                <EmojiPicker
                  lazyLoadEmojis
                  previewConfig={{ showPreview: false }}
                  skinTonesDisabled
                  theme={pickerTheme}
                  width="100%"
                  onEmojiClick={onEmojiPick}
                />
              </div>
            ) : null}
          </div>
        </div>
        <textarea
          ref={bodyRef}
          className="min-h-[180px] resize-y rounded-[var(--bina-r)] border border-[var(--bina-border)] bg-[var(--bina-steel3)] px-3 py-2 font-bina-display text-sm text-[var(--bina-text)] outline-none ring-[var(--bina-or)] focus:ring-2"
          name="body"
          required
          maxLength={8000}
          placeholder={t("bodyPlaceholder")}
        />
        {fieldErrors?.body ? (
          <span className="text-xs text-[var(--bina-red)]">{fieldErrors.body}</span>
        ) : null}
      </label>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-bina-display text-[11px] font-semibold uppercase tracking-wide text-[var(--bina-muted)]">
            {t("mediaSectionLabel")}
          </span>
          <span className="font-bina-display text-[10px] text-[var(--bina-muted)]">
            {t("photoLimitHint", { max: MAX_PHOTOS })}
          </span>
        </div>
        <input
          ref={fileInputRef}
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          multiple
          type="file"
          onChange={onFileChange}
        />
        <button
          className="inline-flex items-center justify-center rounded-[var(--bina-r)] border border-dashed border-[var(--bina-border)] bg-[var(--bina-steel3)] px-3 py-2 font-bina-display text-xs font-semibold text-[var(--bina-text)] transition-colors hover:border-[var(--bina-or)] hover:text-[var(--bina-or)] disabled:opacity-50"
          disabled={busy || attachments.length >= MAX_PHOTOS}
          type="button"
          onClick={() => fileInputRef.current?.click()}
        >
          {t("addPhotos")}
          {attachments.length > 0 ? ` (${attachments.length}/${MAX_PHOTOS})` : null}
        </button>
        {attachments.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {attachments.map((a, idx) => (
              <li key={a.id} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-[var(--bina-border)]">
                <Image
                  alt=""
                  className="object-cover"
                  fill
                  sizes="96px"
                  src={a.previewUrl}
                  unoptimized
                />
                <button
                  aria-label={t("removePhotoAria", { n: idx + 1 })}
                  className="absolute end-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-sm text-white hover:bg-black/80"
                  type="button"
                  onClick={() => removeAttachment(a.id)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <label className="flex flex-col gap-1">
        <span className="font-bina-display text-[11px] font-semibold uppercase tracking-wide text-[var(--bina-muted)]">
          {t("locationLabel")}
        </span>
        <input
          className="rounded-[var(--bina-r)] border border-[var(--bina-border)] bg-[var(--bina-steel3)] px-3 py-2 font-bina-display text-sm text-[var(--bina-text)] outline-none ring-[var(--bina-or)] focus:ring-2"
          name="location"
          maxLength={120}
          type="text"
          defaultValue={defaultLocation ?? ""}
          placeholder={t("locationPlaceholder")}
        />
        {fieldErrors?.location ? (
          <span className="text-xs text-[var(--bina-red)]">{fieldErrors.location}</span>
        ) : null}
      </label>

      <button
        className="font-bina-display mt-2 rounded-[var(--bina-r)] bg-[var(--bina-or)] px-4 py-3 text-sm font-bold uppercase tracking-wide text-white transition-opacity disabled:opacity-60"
        disabled={busy}
        type="submit"
      >
        {submitting || uploading ? t("submitting") : t("submit")}
      </button>

      <Link
        href="/"
        className="font-bina-display text-center text-[11px] font-semibold text-[var(--bina-or)] underline"
      >
        {t("cancel")}
      </Link>
    </form>
  );
}
