import { FeedTopbar } from "@/components/feed-topbar";
import { FeedTabStrip } from "@/components/feed-tab-strip";
import type { FeedRfqItem } from "@/components/feed-rfq-card";
import { fetchFeedPostPool, fetchLatestVeteransPost } from "@/lib/feed/fetch-feed-posts";
import { filterNearMePosts, rankFeedPostsForYou } from "@/lib/feed/for-you-post-rank";
import { fetchPersonalizationContext } from "@/lib/feed/personalization-context";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const FEED_POST_LIMIT = 60;

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [postPool, rfqRes, veteranPost, ctx] = await Promise.all([
    fetchFeedPostPool(supabase, FEED_POST_LIMIT, user?.id ?? null),
    supabase
      .from("rfq_drafts")
      .select("id,title,created_at,metadata")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    fetchLatestVeteransPost(supabase),
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
      <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: "touch" }}>
        <FeedTabStrip
          posts={postPool}
          forYouPosts={forYouPosts}
          nearMePosts={nearMePosts}
          veteranPost={veteranPost}
          latestRfq={latestRfq}
          viewerId={user?.id ?? null}
        />
      </div>
    </div>
  );
}
