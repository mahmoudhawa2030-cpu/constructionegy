import { ProfileListingsGrid } from "@/components/profile-listings-grid";
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
  categoryLabelMap,
  viewerUserId,
  emptyListings,
}: Props) {
  return (
    <ProfileListingsGrid
      listings={listings}
      empty={emptyListings}
      categoryLabelMap={categoryLabelMap}
      viewerUserId={viewerUserId}
    />
  );
}
