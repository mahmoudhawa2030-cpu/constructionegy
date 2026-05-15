import { FeedTopbar } from "@/components/feed-topbar";
import { HomeStorefront } from "@/components/home-storefront";
import { PullToRefreshScroll } from "@/components/pull-to-refresh-scroll";
import { fetchStorefrontData } from "@/lib/homepage/storefront-data";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [storefront, latestRfqRes, profileRes] = await Promise.all([
    fetchStorefrontData(supabase, user?.id ?? null),
    supabase
      .from("rfq_drafts")
      .select("id")
      .in("status", ["open_for_bids", "submitted"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    user?.id
      ? supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
      : Promise.resolve({ data: null, error: null } as const),
  ]);

  const latestRfqHref = latestRfqRes.data?.id ? `/rfq/${latestRfqRes.data.id}` : null;
  const displayName = profileRes.data?.full_name?.split(" ")[0] ?? null;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--bina-page)]">
      <FeedTopbar />
      <PullToRefreshScroll namespace="feed" platformScope="mobileTouch">
        {/* Desktop container - constrained width, centered */}
        <div className="mx-auto w-full max-w-7xl px-0 sm:px-4 lg:px-6">
          <HomeStorefront
            hasUser={Boolean(user)}
            displayName={displayName}
            categories={storefront.categories}
            flashDeals={storefront.flashDeals}
            trending={storefront.trending}
            suppliers={storefront.suppliers}
            recentOrders={storefront.recentOrders}
            latestRfqHref={latestRfqHref}
          />
        </div>
      </PullToRefreshScroll>
    </div>
  );
}
