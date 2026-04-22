"use client";

import { useState } from "react";

import type { FeedPostCommentItem } from "@/lib/feed/fetch-post-comments";
import { FeedPostCommentForm } from "./feed-post-comment-form";

type Props = {
  comment: FeedPostCommentItem;
  replies: FeedPostCommentItem[];
  postId: string;
  viewerId: string | null;
  locale: string;
  replyButtonLabel: string;
};

function rel(iso: string, locale: string) {
  const diff = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  const rtf = new Intl.RelativeTimeFormat(locale === "ar" ? "ar" : "en", { numeric: "auto" });
  if (diff < 60) return rtf.format(-diff, "second");
  const m = Math.floor(diff / 60);
  if (m < 60) return rtf.format(-m, "minute");
  const h = Math.floor(m / 60);
  if (h < 48) return rtf.format(-h, "hour");
  return rtf.format(-Math.floor(h / 24), "day");
}

function MentionBody({ body }: { body: string }) {
  const parts = body.split(/(@\S+)/g);
  return (
    <p className="whitespace-pre-wrap font-bina-display text-[12px] leading-relaxed text-[var(--bina-text)]">
      {parts.map((part, i) =>
        part.startsWith("@") ? (
          <span key={i} className="font-semibold text-[var(--bina-or)]">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </p>
  );
}

function CommentBubble({
  comment,
  locale,
  onReply,
  replyButtonLabel,
  isReply,
}: {
  comment: FeedPostCommentItem;
  locale: string;
  onReply?: () => void;
  replyButtonLabel: string;
  isReply?: boolean;
}) {
  return (
    <div
      className={`rounded-[var(--bina-r)] border border-[var(--bina-border)] bg-[var(--bina-steel2)] px-3 py-2 ${
        isReply ? "ms-6 border-s-2 border-s-[var(--bina-or)]" : ""
      }`}
    >
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-1">
        <span className="font-bina-display text-[11px] font-bold text-[var(--bina-text)]">
          {comment.author_name}
        </span>
        <time className="font-bina-display text-[9px] text-[var(--bina-muted)]" dateTime={comment.created_at}>
          {rel(comment.created_at, locale)}
        </time>
      </div>
      <MentionBody body={comment.body} />
      {onReply ? (
        <button
          type="button"
          onClick={onReply}
          className="mt-1 font-bina-display text-[10px] font-semibold text-[var(--bina-or)] hover:underline"
        >
          {replyButtonLabel}
        </button>
      ) : null}
    </div>
  );
}

export function CommentThread({ comment, replies, postId, viewerId, locale, replyButtonLabel }: Props) {
  const [replyingToId, setReplyingToId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <CommentBubble
        comment={comment}
        locale={locale}
        replyButtonLabel={replyButtonLabel}
        onReply={viewerId ? () => setReplyingToId(comment.id) : undefined}
      />

      {replyingToId === comment.id ? (
        <div className="ms-6">
          <FeedPostCommentForm
            postId={postId}
            viewerId={viewerId}
            replyTo={{ id: comment.id, authorName: comment.author_name }}
            onCancel={() => setReplyingToId(null)}
            autoFocus
          />
        </div>
      ) : null}

      {replies.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {replies.map((reply) => (
            <li key={reply.id}>
              <CommentBubble
                comment={reply}
                locale={locale}
                replyButtonLabel={replyButtonLabel}
                isReply
                onReply={
                  viewerId
                    ? () => setReplyingToId(reply.id)
                    : undefined
                }
              />
              {replyingToId === reply.id ? (
                <div className="ms-6 mt-2">
                  <FeedPostCommentForm
                    postId={postId}
                    viewerId={viewerId}
                    replyTo={{ id: comment.id, authorName: reply.author_name }}
                    onCancel={() => setReplyingToId(null)}
                    autoFocus
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
