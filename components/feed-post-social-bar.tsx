"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { toggleFeedPostLike, toggleFeedPostSave } from "@/lib/feed/feed-post-social-actions";

export type FeedPostSocialBarProps = {
  postId: string;
  title: string;
  initialLikeCount: number;
  initialCommentCount: number;
  initialLiked: boolean;
  initialSaved: boolean;
  viewerId: string | null;
  variant?: "default" | "veterans";
  /** When true, omit top margin (e.g. embedded on post detail). */
  embed?: boolean;
};

export function FeedPostSocialBar({
  postId,
  title,
  initialLikeCount,
  initialCommentCount,
  initialLiked,
  initialSaved,
  viewerId,
  variant = "default",
  embed = false,
}: FeedPostSocialBarProps) {
  const t = useTranslations("feed");
  const router = useRouter();
  const locale = useLocale();
  const isAr = locale === "ar";
  const [pending, startTransition] = useTransition();
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [liked, setLiked] = useState(initialLiked);
  const [saved, setSaved] = useState(initialSaved);
  const [copied, setCopied] = useState(false);
  const [commentCount, setCommentCount] = useState(initialCommentCount);

  useEffect(() => {
    setLikeCount(initialLikeCount);
    setLiked(initialLiked);
    setSaved(initialSaved);
    setCommentCount(initialCommentCount);
  }, [initialLikeCount, initialLiked, initialSaved, initialCommentCount, postId]);

  const borderVar = variant === "veterans" ? "#604010" : "var(--bina-border)";

  function requireAuth(): boolean {
    if (viewerId) return true;
    router.push(`/login?next=${encodeURIComponent(`/posts/${postId}`)}`);
    return false;
  }

  function onLike(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!requireAuth()) return;
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => Math.max(0, c + (next ? 1 : -1)));
    startTransition(async () => {
      const res = await toggleFeedPostLike(postId);
      if (!res.ok) {
        setLiked(!next);
        setLikeCount((c) => Math.max(0, c + (next ? -1 : 1)));
      }
      router.refresh();
    });
  }

  function onSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!requireAuth()) return;
    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      const res = await toggleFeedPostSave(postId);
      if (!res.ok) {
        setSaved(!next);
      }
      router.refresh();
    });
  }

  async function onShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const url = typeof window !== "undefined" ? `${window.location.origin}/posts/${postId}` : "";
    if (!url) return;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text: title, url });
        return;
      }
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      if (name === "AbortError") return;
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        }
      } catch {
        /* ignore */
      }
    }
  }

  const commentHref = `/posts/${postId}#comments`;

  if (variant === "veterans") {
    return (
      <div className="flex border-t" style={{ borderColor: borderVar }}>
        <button
          type="button"
          disabled={pending}
          onClick={onLike}
          className={`flex flex-1 items-center justify-center gap-1 border-r py-[7px] font-bina-display text-[9px] font-semibold transition-opacity disabled:opacity-50 ${
            liked ? "text-[var(--bina-gold)]" : "text-[var(--bina-muted)]"
          }`}
          style={{ borderColor: borderVar }}
        >
          <span className="text-[11px]">👏</span>
          {likeCount > 0 ? <span>{likeCount}</span> : null}
          {isAr ? "إعجاب" : "Like"}
        </button>
        <Link
          href={commentHref}
          prefetch
          className="flex flex-1 items-center justify-center gap-1 border-r py-[7px] font-bina-display text-[9px] font-semibold text-[var(--bina-muted)]"
          style={{ borderColor: borderVar }}
        >
          <span className="text-[11px]">💬</span>
          {commentCount > 0 ? <span>{commentCount}</span> : null}
          {isAr ? "تعليق" : "Comment"}
        </Link>
        <Link
          href={commentHref}
          prefetch
          className="flex flex-1 items-center justify-center gap-1 py-[7px] font-bina-display text-[9px] font-bold text-[var(--bina-or)]"
        >
          {isAr ? "اسأل المرشد" : "Ask Mentor"}
        </Link>
      </div>
    );
  }

  return (
    <div className={`flex border-t border-[var(--bina-border)] ${embed ? "" : "mt-1"}`}>
      <button
        type="button"
        disabled={pending}
        onClick={onLike}
        className={`flex flex-1 items-center justify-center gap-1 border-r border-[var(--bina-border)] py-[7px] font-bina-display text-[9px] font-semibold transition-opacity disabled:opacity-50 ${
          liked ? "text-[var(--bina-or)]" : "text-[var(--bina-muted)]"
        }`}
      >
        <span className="text-[11px]">👍</span>
        {likeCount > 0 ? <span>{likeCount}</span> : null}
        {isAr ? "إعجاب" : "Like"}
      </button>
      <Link
        href={commentHref}
        prefetch
        className="flex flex-1 items-center justify-center gap-1 border-r border-[var(--bina-border)] py-[7px] font-bina-display text-[9px] font-semibold text-[var(--bina-muted)]"
      >
        <span className="text-[11px]">💬</span>
        {commentCount > 0 ? <span>{commentCount}</span> : null}
        {isAr ? "تعليق" : "Comment"}
      </Link>
      <button
        type="button"
        onClick={onShare}
        className="relative flex flex-1 items-center justify-center gap-1 border-r border-[var(--bina-border)] py-[7px] font-bina-display text-[9px] font-semibold text-[var(--bina-muted)]"
      >
        <span className="text-[11px]">📤</span>
        {copied ? t("social.linkCopied") : isAr ? "مشاركة" : "Share"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={onSave}
        className={`flex flex-1 items-center justify-center gap-1 py-[7px] font-bina-display text-[9px] font-semibold transition-opacity disabled:opacity-50 ${
          saved ? "text-[var(--bina-or)]" : "text-[var(--bina-muted)]"
        }`}
      >
        <span className="text-[11px]">🔖</span>
        {isAr ? "حفظ" : "Save"}
      </button>
    </div>
  );
}
