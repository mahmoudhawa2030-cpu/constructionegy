"use client";

import { useState } from "react";

import type { FeedPostCommentItem } from "@/lib/feed/fetch-post-comments";
import { CommentThread } from "./comment-thread";
import { FeedPostCommentForm } from "./feed-post-comment-form";

type Props = {
  initialComments: FeedPostCommentItem[];
  postId: string;
  viewerId: string | null;
  viewerName: string | null;
  commentsHeading: string;
  noCommentsLabel: string;
  locale: string;
  replyButtonLabel: string;
  borderClass?: string;
};

export function CommentsSection({
  initialComments,
  postId,
  viewerId,
  viewerName,
  commentsHeading,
  noCommentsLabel,
  locale,
  replyButtonLabel,
  borderClass = "border-[var(--bina-border)]",
}: Props) {
  const [comments, setComments] = useState<FeedPostCommentItem[]>(initialComments);

  function handleNewComment(body: string, parentId: string | null) {
    if (!viewerId) return;
    const optimistic: FeedPostCommentItem = {
      id: `optimistic-${Date.now()}`,
      body,
      created_at: new Date().toISOString(),
      author_name: viewerName ?? "—",
      author_user_id: viewerId,
      parent_id: parentId,
    };
    setComments((prev) => [...prev, optimistic]);
  }

  const topLevel = comments.filter((c) => !c.parent_id);
  const repliesMap = new Map<string, FeedPostCommentItem[]>();
  for (const c of comments) {
    if (c.parent_id) {
      const arr = repliesMap.get(c.parent_id) ?? [];
      arr.push(c);
      repliesMap.set(c.parent_id, arr);
    }
  }

  return (
    <section id="comments" className={`mt-8 scroll-mt-4 border-t pt-6 ${borderClass}`}>
      <h2 className="font-bina-display mb-3 text-[12px] font-black uppercase tracking-wide text-[var(--bina-text)]">
        {commentsHeading}
      </h2>
      <div className="mb-6">
        <FeedPostCommentForm
          postId={postId}
          viewerId={viewerId}
          onSuccess={(body, parentId) => handleNewComment(body, parentId ?? null)}
        />
      </div>
      {comments.length === 0 ? (
        <p className="font-bina-display text-[11px] text-[var(--bina-muted)]">{noCommentsLabel}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {topLevel.map((c) => (
            <li key={c.id}>
              <CommentThread
                comment={c}
                replies={repliesMap.get(c.id) ?? []}
                postId={postId}
                viewerId={viewerId}
                locale={locale}
                replyButtonLabel={replyButtonLabel}
                onNewReply={(body, parentId) => handleNewComment(body, parentId)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
