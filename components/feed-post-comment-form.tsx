"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { addFeedPostComment } from "@/lib/feed/feed-post-social-actions";

type Props = {
  postId: string;
  viewerId: string | null;
  replyTo?: { id: string; authorName: string } | null;
  onCancel?: () => void;
  onSuccess?: (body: string, parentId: string | null) => void;
  autoFocus?: boolean;
};

export function FeedPostCommentForm({ postId, viewerId, replyTo, onCancel, onSuccess, autoFocus }: Props) {
  const t = useTranslations("feed");
  const [body, setBody] = useState(replyTo ? `@${replyTo.authorName} ` : "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isReply = Boolean(replyTo);
  const parentId = replyTo?.id ?? null;

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      const el = textareaRef.current;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [autoFocus]);

  if (!viewerId) {
    const next = encodeURIComponent(`/posts/${postId}#comments`);
    return (
      <p className="font-bina-display text-[11px] text-[var(--bina-muted)]">
        <Link href={`/login?next=${next}`} className="font-semibold text-[var(--bina-or)] underline">
          {t("social.loginToComment")}
        </Link>
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || submitting) return;

    setError(null);

    // 1. Show comment instantly — fire optimistic before any await
    onSuccess?.(trimmed, parentId);
    setBody("");
    if (onCancel) onCancel();

    // 2. Submit to server in background
    setSubmitting(true);
    try {
      const result = await addFeedPostComment(postId, trimmed, parentId);
      if (!result.ok) {
        setError(result.message ?? t("social.commentError"));
      }
    } catch {
      setError(t("social.commentError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label className="flex flex-col gap-1">
        <span className="font-bina-display text-[10px] font-semibold uppercase tracking-wide text-[var(--bina-muted)]">
          {isReply ? t("social.replyLabel", { name: replyTo!.authorName }) : t("social.commentLabel")}
        </span>
        <textarea
          ref={textareaRef}
          name="body"
          required
          maxLength={2000}
          rows={isReply ? 2 : 3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="resize-y rounded-[var(--bina-r)] border border-[var(--bina-border)] bg-[var(--bina-steel3)] px-3 py-2 font-bina-display text-sm text-[var(--bina-text)] outline-none ring-[var(--bina-or)] focus:ring-2"
          placeholder={isReply ? t("social.replyPlaceholder") : t("social.commentPlaceholder")}
        />
      </label>
      {error ? (
        <p className="font-bina-display text-xs text-[var(--bina-red)]">{error}</p>
      ) : null}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting || !body.trim()}
          className="font-bina-display w-fit rounded-[var(--bina-r)] bg-[var(--bina-or)] px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-white disabled:opacity-60"
        >
          {isReply ? t("social.replySubmit") : t("social.commentSubmit")}
        </button>
        {isReply && onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="font-bina-display text-[11px] font-semibold text-[var(--bina-muted)] underline"
          >
            {t("social.cancelReply")}
          </button>
        ) : null}
      </div>
    </form>
  );
}
