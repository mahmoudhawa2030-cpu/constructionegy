import { getTranslations } from "next-intl/server";

import { FeedPostCard } from "@/components/feed-post-card";
import { ProfileListingsGrid } from "@/components/profile-listings-grid";
import { ProfileTabSwitcher } from "@/components/profile-tab-switcher";
import type { FeedPostItem } from "@/lib/feed/feed-post-types";
import type { Database } from "@/lib/supabase/database.types";

type ListingRow = Database["public"]["Tables"]["listings"]["Row"];

type Props = {
  listings: ListingRow[];
  posts: FeedPostItem[];
  categoryLabelMap: Record<string, string>;
  viewerUserId: string | null;
  emptyListings: string;
};

export async function ProfileTabStrip({
  listings,
  posts,
  categoryLabelMap,
  viewerUserId,
  emptyListings,
}: Props) {
  const t = await getTranslations("publicProfile");

  const classifiedsContent = (
    <ProfileListingsGrid
      listings={listings}
      empty={emptyListings}
      categoryLabelMap={categoryLabelMap}
      viewerUserId={viewerUserId}
    />
  );

  const postsContent = (
    <div className="flex flex-col gap-3">
      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
          {t("emptyPosts")}
        </div>
      ) : (
        posts.map((item) => (
          <FeedPostCard
            key={item.id}
            item={item}
            viewerId={viewerUserId}
            priority={false}
          />
        ))
      )}
    </div>
  );

  return (
    <ProfileTabSwitcher
      labelClassifieds={t("tabClassifieds")}
      labelPosts={t("tabPosts")}
      classifiedsContent={classifiedsContent}
      postsContent={postsContent}
    />
  );
}
