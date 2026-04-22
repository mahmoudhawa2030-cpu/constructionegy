"use client";

import { useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";
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

  useEffect(() => {
    const supabase = createClient();

    type RealtimeRow = {
      id: string;
      body: string;
      created_at: string;
      user_id: string;
      parent_id: string | null;
    };

    const channel = supabase
      .channel(`comments-${postId}-${Math.random()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "feed_post_comments",
          filter: `post_id=eq.${postId}`,
        },
        async (payload) => {
          const row = payload.new as RealtimeRow;

          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", row.user_id)
            .maybeSingle();

          const incoming: FeedPostCommentItem = {
            id: row.id,
            body: row.body,
            created_at: row.created_at,
            author_name: profile?.full_name ?? "—",
            author_user_id: row.user_id,
            parent_id: row.parent_id ?? null,
          };

          setComments((prev) => {
            if (prev.some((c) => c.id === row.id)) return prev;
            const withoutOptimistic = prev.filter(
              (c) => !(c.id.startsWith("optimistic-") && c.author_user_id === row.user_id && c.body.trim() === row.body.trim()),
            );
            return [...withoutOptimistic, incoming];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  function handleNewComment(body: string, parentId: string | null) {
    if (!viewerId) return;
    const optimisticId = `optimistic-${Date.now()}`;
    const optimistic: FeedPostCommentItem = {
      id: optimisticId,
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
