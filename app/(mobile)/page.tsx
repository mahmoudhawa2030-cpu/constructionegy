import { FeedTopbar } from "@/components/feed-topbar";
import { HomeStorefront } from "@/components/home-storefront";
import { PullToRefreshScroll } from "@/components/pull-to-refresh-scroll";
import { fetchStorefrontData, fetchCategoryListings } from "@/lib/homepage/storefront-data";
import { getMergedHomepageConfig } from "@/lib/homepage/actions";
import type { HomepageContent, SectionConfig } from "@/lib/homepage/types";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [storefront, latestRfqRes, profileRes, homepageConfig] = await Promise.all([
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
    getMergedHomepageConfig(),
  ]);

  // Collect listing_category sections to fetch their listings
  const categorySlugs = homepageConfig.sections
    .filter((s) => s.type === "listing_category" && s.enabled && s.customData?.categorySlug)
    .map((s) => ({
      slug: s.customData.categorySlug as string,
      limit: (s.customData.rows || 2) * 2, // 2 columns × N rows
    }));

  const categoryListings = await fetchCategoryListings(supabase, categorySlugs);

  const latestRfqHref = latestRfqRes.data?.id ? `/rfq/${latestRfqRes.data.id}` : null;
  const displayName = profileRes.data?.full_name?.split(" ")[0] ?? null;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--bina-page)]">
      <FeedTopbar />
      <PullToRefreshScroll namespace="feed" platformScope="mobileTouch">
        <HomeStorefront
          hasUser={Boolean(user)}
          displayName={displayName}
          categories={storefront.categories}
          flashDeals={storefront.flashDeals}
          trending={storefront.trending}
          suppliers={storefront.suppliers}
          recentOrders={storefront.recentOrders}
          latestRfqHref={latestRfqHref}
          sections={homepageConfig.sections}
          content={homepageConfig.content}
          categoryListings={categoryListings}
        />
      </PullToRefreshScroll>
    </div>
  );
}
