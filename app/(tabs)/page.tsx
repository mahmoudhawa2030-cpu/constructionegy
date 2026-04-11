import { FeedSocialResyncProvider } from "@/components/feed-social-resync-context";
import { FeedTopbar } from "@/components/feed-topbar";
import { FeedTabStrip } from "@/components/feed-tab-strip";
import { PullToRefreshScroll } from "@/components/pull-to-refresh-scroll";
import type { FeedRfqItem } from "@/components/feed-rfq-card";
import { fetchFeedPostPool, fetchLatestVeteransPost } from "@/lib/feed/fetch-feed-posts";
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

  const [postPool, rfqRes, veteranPost, ctx] = await Promise.all([
    fetchFeedPostPool(supabase, FEED_POST_LIMIT, user?.id ?? null),
    supabase
      .from("rfq_drafts")
      .select("id,title,created_at,metadata")
      .in("status", ["open_for_bids", "submitted"])
      .order("created_at", { ascending: false })
      .limit(1),
    fetchLatestVeteransPost(supabase, user?.id ?? null),
    user?.id ? fetchPersonalizationContext(supabase, user.id) : Promise.resolve(null),
  ]);

  const forYouPosts = rankFeedPostsForYou(postPool, ctx);
  const nearMePosts = filterNearMePosts(postPool, ctx?.viewerLocationNorm ?? null);

  const rfqRow = !rfqRes.error && rfqRes.data?.length ? rfqRes.data[0] : null;
  const latestRfq: FeedRfqItem | null = rfqRow
    ? {
        id: rfqRow.id,
        title: rfqRow.title ?? "RFQ",
        location: (rfqRow.metadata as Record<string, unknown>)?.location as string | null ?? null,
        created_at: rfqRow.created_at,
        quote_count: 0,
      }
    : null;

  // Temporary debug for RFQ visibility issue (remove after fix)
  const rfqDebug = {
    hasError: !!rfqRes.error,
    error: rfqRes.error,
    rowCount: rfqRes.data?.length ?? 0,
    hasRfq: !!latestRfq,
    firstRowId: rfqRow?.id,
    statusFilter: ["open_for_bids", "submitted"],
  };

  return (
    <FeedSocialResyncProvider>
      <div className="flex min-h-0 flex-1 flex-col bg-[var(--bina-steel)]">
        <FeedTopbar />
        <PullToRefreshScroll namespace="feed" platformScope="mobileTouch">
          {/* RFQ Debug Panel - visible only during development */}
          {process.env.NODE_ENV === "development" && (
            <div className="mx-3 mb-4 rounded-xl border border-orange-400 bg-orange-50 p-3 text-[10px] dark:bg-orange-950 dark:border-orange-600">
              <div className="font-bold text-orange-700 dark:text-orange-400 mb-1">RFQ Debug (dev only)</div>
              <pre className="overflow-auto whitespace-pre-wrap text-[9px] text-orange-800 dark:text-orange-300">
                {JSON.stringify(rfqDebug, null, 2)}
              </pre>
              <div className="mt-2 text-[9px] text-orange-600 dark:text-orange-400">
                No RFQ card = no row with status "submitted" or "open_for_bids" visible to current user.
                <br />
                Create/publish an RFQ in /rfq or Admin → RFQ.
              </div>
            </div>
          )}

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
