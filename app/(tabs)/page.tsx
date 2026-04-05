import { FeedTopbar } from "@/components/feed-topbar";
import { FeedTabStrip } from "@/components/feed-tab-strip";
import { PullToRefreshScroll } from "@/components/pull-to-refresh-scroll";
import type { FeedRfqItem } from "@/components/feed-rfq-card";
import { fetchFeedPostPool, fetchLatestVeteransPost } from "@/lib/feed/fetch-feed-posts";
import { filterNearMePosts, rankFeedPostsForYou } from "@/lib/feed/for-you-post-rank";
import { fetchPersonalizationContext } from "@/lib/feed/personalization-context";
import { createClient } from "@/lib/supabase/server";
import { unstable_noStore } from "next/cache";

export const dynamic = "force-dynamic";

// Keep the first paint lighter on mobile; larger feeds can be paginated later.
const FEED_POST_LIMIT = 18;

export default async function HomePage() {
  unstable_noStore(); // Force fresh data on every request (including router.refresh / pull-to-refresh)

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Force client components to remount after pull-to-refresh so social state resets
  const refreshKey = Date.now();

  const [postPool, rfqRes, veteranPost, ctx] = await Promise.all([
    fetchFeedPostPool(supabase, FEED_POST_LIMIT, user?.id ?? null),
    supabase
      .from("rfq_drafts")
      .select("id,title,created_at,metadata")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    fetchLatestVeteransPost(supabase, user?.id ?? null),
    user?.id ? fetchPersonalizationContext(supabase, user.id) : Promise.resolve(null),
  ]);

  const forYouPosts = rankFeedPostsForYou(postPool, ctx);
  const nearMePosts = filterNearMePosts(postPool, ctx?.viewerLocationNorm ?? null);

  const latestRfq: FeedRfqItem | null = rfqRes.data
    ? {
        id: rfqRes.data.id,
        title: rfqRes.data.title ?? "RFQ",
        location: (rfqRes.data.metadata as Record<string, unknown>)?.location as string | null ?? null,
        created_at: rfqRes.data.created_at,
        quote_count: 0,
      }
    : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--bina-steel)]">
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
  );
}
