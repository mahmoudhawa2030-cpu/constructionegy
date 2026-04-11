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
  /** Feed cards: LinkedIn-style row (dividers, hover, touch targets). */
  layout?: "default" | "linkedin";
  /** When true, omit top margin (e.g. embedded on post detail). */
  embed?: boolean;
  refreshKey?: number;
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
  layout = "default",
  embed = false,
  refreshKey = 0,
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

  // Sync with server props when refreshKey changes (pull-to-refresh)
  useEffect(() => {
    setLikeCount(initialLikeCount);
    setLiked(initialLiked);
    setSaved(initialSaved);
    setCommentCount(initialCommentCount);
  }, [initialLikeCount, initialLiked, initialSaved, initialCommentCount, refreshKey]);

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
          className={`flex min-h-[36px] flex-1 items-center justify-center gap-0.5 border-r py-1 font-bina-display text-[8px] font-semibold transition-opacity disabled:opacity-50 ${
            liked ? "text-[var(--bina-gold)]" : "text-[var(--bina-muted)]"
          }`}
          style={{ borderColor: borderVar }}
        >
          <span className="text-[10px] leading-none">👏</span>
          {likeCount > 0 ? <span>{likeCount}</span> : null}
          {t("social.claps")}
        </button>
        <Link
          href={commentHref}
          prefetch
          className="flex min-h-[36px] flex-1 items-center justify-center gap-0.5 border-r py-1 font-bina-display text-[8px] font-semibold text-[var(--bina-muted)]"
          style={{ borderColor: borderVar }}
        >
          <span className="text-[10px] leading-none">💬</span>
          {commentCount > 0 ? <span>{commentCount}</span> : null}
          {t("social.comments")}
        </Link>
        <Link
          href={commentHref}
          prefetch
          className="flex min-h-[36px] flex-1 items-center justify-center gap-0.5 py-1 font-bina-display text-[8px] font-bold text-[var(--bina-or)]"
        >
          {t("askMentor")}
        </Link>
      </div>
    );
  }

  const cellBase =
    layout === "linkedin"
      ? "flex min-h-[40px] flex-1 items-center justify-center gap-1 px-0.5 font-bina-display text-[10px] font-semibold transition-colors active:bg-black/[0.04] disabled:opacity-50 dark:active:bg-white/[0.06] sm:min-h-[42px] sm:text-[11px]"
      : "flex flex-1 items-center justify-center gap-1 py-[7px] font-bina-display text-[9px] font-semibold transition-opacity disabled:opacity-50";

  const rowClass =
    layout === "linkedin"
      ? "flex min-h-[40px] divide-x divide-[var(--bina-border)] border-t border-[var(--bina-border)] sm:min-h-[42px]"
      : `flex divide-x divide-[var(--bina-border)] border-t border-[var(--bina-border)] ${embed ? "" : "mt-1"}`;

  const likeClass = `${cellBase} ${liked ? "text-[var(--bina-or)]" : "text-[var(--bina-muted)]"} ${layout === "linkedin" ? "hover:bg-black/[0.03] dark:hover:bg-white/[0.04]" : ""}`;
  const mutedCell = `${cellBase} text-[var(--bina-muted)] ${layout === "linkedin" ? "hover:bg-black/[0.03] dark:hover:bg-white/[0.04]" : ""}`;
  const saveClass = `${cellBase} ${saved ? "text-[var(--bina-or)]" : "text-[var(--bina-muted)]"} ${layout === "linkedin" ? "hover:bg-black/[0.03] dark:hover:bg-white/[0.04]" : ""}`;

  return (
    <div className={rowClass}>
      <button className={likeClass} disabled={pending} onClick={onLike} type="button">
        <span className={layout === "linkedin" ? "text-[13px] leading-none" : "text-[11px]"}>👍</span>
        {likeCount > 0 ? <span className="tabular-nums">{likeCount}</span> : null}
        <span>{isAr ? "إعجاب" : "Like"}</span>
      </button>
      <Link className={mutedCell} href={commentHref} prefetch>
        <span className={layout === "linkedin" ? "text-[13px] leading-none" : "text-[11px]"}>💬</span>
        {commentCount > 0 ? <span className="tabular-nums">{commentCount}</span> : null}
        <span>{isAr ? "تعليق" : "Comment"}</span>
      </Link>
      <button className={`${mutedCell} relative`} onClick={onShare} type="button">
        <span className={layout === "linkedin" ? "text-[13px] leading-none" : "text-[11px]"}>📤</span>
        <span>{copied ? t("social.linkCopied") : isAr ? "مشاركة" : "Share"}</span>
      </button>
      <button className={saveClass} disabled={pending} onClick={onSave} type="button">
        <span className={layout === "linkedin" ? "text-[13px] leading-none" : "text-[11px]"}>📌</span>
        <span>{isAr ? "حفظ" : "Save"}</span>
      </button>
    </div>
  );
}
