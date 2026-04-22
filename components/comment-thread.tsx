"use client";

import { useState } from "react";
import Link from "next/link";

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

function MentionBody({ body, nameToUserId }: { body: string; nameToUserId: Map<string, string> }) {
  const tokens: { text: string; userId: string | null }[] = [];
  let remaining = body;

  while (remaining.length > 0) {
    const atIdx = remaining.indexOf("@");
    if (atIdx === -1) {
      tokens.push({ text: remaining, userId: null });
      break;
    }
    if (atIdx > 0) {
      tokens.push({ text: remaining.slice(0, atIdx), userId: null });
      remaining = remaining.slice(atIdx);
      continue;
    }
    const withoutAt = remaining.slice(1);
    const sortedNames = [...nameToUserId.keys()].sort((a, b) => b.length - a.length);
    const matched = sortedNames.find((name) => withoutAt.startsWith(name));
    if (matched) {
      tokens.push({ text: `@${matched}`, userId: nameToUserId.get(matched) ?? null });
      remaining = remaining.slice(1 + matched.length);
    } else {
      const spaceIdx = remaining.indexOf(" ", 1);
      const end = spaceIdx === -1 ? remaining.length : spaceIdx;
      tokens.push({ text: remaining.slice(0, end), userId: null });
      remaining = remaining.slice(end);
    }
  }

  return (
    <p className="whitespace-pre-wrap font-bina-display text-[12px] leading-relaxed text-[var(--bina-text)]">
      {tokens.map((token, i) =>
        token.userId ? (
          <Link
            key={i}
            href={`/profile/${token.userId}`}
            className="font-semibold text-[var(--bina-or)] underline underline-offset-2"
          >
            {token.text}
          </Link>
        ) : (
          token.text
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
  nameToUserId,
}: {
  comment: FeedPostCommentItem;
  locale: string;
  onReply?: () => void;
  replyButtonLabel: string;
  isReply?: boolean;
  nameToUserId: Map<string, string>;
}) {
  return (
    <div
      className={`rounded-[var(--bina-r)] border border-[var(--bina-border)] bg-[var(--bina-steel2)] px-3 py-2 ${
        isReply ? "ms-6 border-s-2 border-s-[var(--bina-or)]" : ""
      }`}
    >
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-1">
        <Link
          href={`/profile/${comment.author_user_id}`}
          className="font-bina-display text-[11px] font-bold text-[var(--bina-text)] hover:underline"
        >
          {comment.author_name}
        </Link>
        <time className="font-bina-display text-[9px] text-[var(--bina-muted)]" dateTime={comment.created_at}>
          {rel(comment.created_at, locale)}
        </time>
      </div>
      <MentionBody body={comment.body} nameToUserId={nameToUserId} />
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

  const nameToUserId = new Map<string, string>(
    [comment, ...replies].map((c) => [c.author_name, c.author_user_id]),
  );

  return (
    <div className="flex flex-col gap-2">
      <CommentBubble
        comment={comment}
        locale={locale}
        replyButtonLabel={replyButtonLabel}
        nameToUserId={nameToUserId}
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
                nameToUserId={nameToUserId}
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
