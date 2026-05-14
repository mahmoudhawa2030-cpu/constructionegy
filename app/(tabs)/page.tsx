import { FeedSocialResyncProvider } from "@/components/feed-social-resync-context";
import { FeedTopbar } from "@/components/feed-topbar";
import { FeedTabStrip } from "@/components/feed-tab-strip";
import { PullToRefreshScroll } from "@/components/pull-to-refresh-scroll";
import type { FeedRfqItem } from "@/components/feed-rfq-card";
import { fetchFeedPostPoolAndVeteran } from "@/lib/feed/fetch-feed-posts";
import { filterNearMePosts, rankFeedPostsForYou } from "@/lib/feed/for-you-post-rank";
import { fetchPersonalizationContext } from "@/lib/feed/personalization-context";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Keep the first paint lighter on mobile; larger feeds can be paginated later.
const FEED_POST_LIMIT = 18;

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Force client components to remount after pull-to-refresh so social state resets
  const refreshKey = Date.now();

  const [feedResult, rfqRes, ctx] = await Promise.all([
    fetchFeedPostPoolAndVeteran(supabase, FEED_POST_LIMIT, user?.id ?? null),
    supabase
      .from("rfq_drafts")
      .select("id,title,created_at,metadata")
      .in("status", ["open_for_bids", "submitted"])
      .order("created_at", { ascending: false })
      .limit(1),
    user?.id ? fetchPersonalizationContext(supabase, user.id) : Promise.resolve(null),
  ]);

  const postPool = feedResult.posts;
  const veteranPost = feedResult.veteranPost;
  const forYouPosts = rankFeedPostsForYou(postPool, ctx);
  const nearMePosts = filterNearMePosts(postPool, ctx?.viewerLocationNorm ?? null);

  const rfqRow = !rfqRes.error && rfqRes.data?.length ? rfqRes.data[0] : null;
  const latestRfq: FeedRfqItem | null = rfqRow
    ? {
        id: rfqRow.id,
        title: rfqRow.title ?? "Untitled RFQ",
        location: (rfqRow.metadata as Record<string, unknown>)?.location as string | null ?? null,
        created_at: rfqRow.created_at,
        quote_count: 0,
      }
    : null;

  // RFQ debug removed after ensuring reliable 3-card rendering on mobile homepage.

  return (
    <FeedSocialResyncProvider>
      <div className="flex min-h-0 flex-1 flex-col bg-[var(--bina-page)]">
        <FeedTopbar />
        <PullToRefreshScroll namespace="feed" platformScope="mobileTouch">
          <FeedTabStrip
            posts={postPool}
            forYouPosts={forYouPosts}
            nearMePosts={nearMePosts}
            veteranPost={veteranPost}
            latestRfq={latestRfq}
            viewerId={user?.id ?? null}
            refreshKey={refreshKey}
          />
        </PullToRefreshScroll>
      </div>
    </FeedSocialResyncProvider>
  );
}
