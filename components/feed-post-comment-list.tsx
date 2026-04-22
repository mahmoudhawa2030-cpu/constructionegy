import { getLocale, getTranslations } from "next-intl/server";

import type { FeedPostCommentItem } from "@/lib/feed/fetch-post-comments";
import { CommentThread } from "./comment-thread";

type Props = {
  comments: FeedPostCommentItem[];
  postId: string;
  viewerId: string | null;
};

export async function FeedPostCommentList({ comments, postId, viewerId }: Props) {
  const locale = await getLocale();
  const t = await getTranslations("feed");

  if (!comments.length) {
    return <p className="font-bina-display text-[11px] text-[var(--bina-muted)]">{t("social.noComments")}</p>;
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
    <ul className="flex flex-col gap-3">
      {topLevel.map((c) => (
        <li key={c.id}>
          <CommentThread
            comment={c}
            replies={repliesMap.get(c.id) ?? []}
            postId={postId}
            viewerId={viewerId}
            locale={locale}
            replyButtonLabel={t("social.replyButton")}
          />
        </li>
      ))}
    </ul>
  );
}
