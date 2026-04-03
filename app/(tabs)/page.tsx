import { FeedTopbar } from "@/components/feed-topbar";
import { FeedTabStrip } from "@/components/feed-tab-strip";
import { fetchFeedItems } from "@/components/industry-feed";
import type { FeedRfqItem } from "@/components/feed-rfq-card";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();

  const [feedItems, rfqRes] = await Promise.all([
    fetchFeedItems(supabase, 20),
    supabase
      .from("rfq_drafts")
      .select("id,title,created_at,metadata")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const rfqItems: FeedRfqItem[] = (rfqRes.data ?? []).map((r) => ({
    id: r.id,
    title: r.title ?? "RFQ",
    location: (r.metadata as Record<string, unknown>)?.location as string | null ?? null,
    created_at: r.created_at,
    quote_count: 0,
  }));

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--bina-steel)]">
      <FeedTopbar />
      <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: "touch" }}>
        <FeedTabStrip items={feedItems} rfqItems={rfqItems} />
      </div>
    </div>
  );
}
