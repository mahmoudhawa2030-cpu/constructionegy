import type { FeedListingItem } from "@/components/industry-feed";

import type { PersonalizationContext } from "@/lib/feed/personalization-context";

function normalizeLocation(loc: string | null): string {
  return (loc ?? "").trim().toLowerCase();
}

/** Loose match: shared tokens or substring overlap between viewer profile location and listing location. */
function locationTokensMatch(viewerNorm: string | null, listingLoc: string | null): boolean {
  if (!viewerNorm || !listingLoc) return false;
  const L = normalizeLocation(listingLoc);
  if (!L) return false;
  if (L.includes(viewerNorm) || viewerNorm.includes(L)) return true;
  const vParts = viewerNorm.split(/[\s,،·]+/).filter((p) => p.length >= 2);
  const lParts = L.split(/[\s,،·]+/).filter((p) => p.length >= 2);
  for (const p of vParts) {
    if (L.includes(p) || lParts.some((q) => q === p || q.includes(p) || p.includes(q))) return true;
  }
  return false;
}

function recencyScore(createdAt: string): number {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageDays = ageMs / (86_400_000);
  return 34 * Math.exp(-ageDays / 6);
}

function popularityScore(viewCount: number): number {
  return Math.min(18, Math.log1p(viewCount) * 4);
}

/**
 * Ranks listings for the signed-in "For You" feed using favorites, own-ad categories,
 * profile location, people the user has chatted with, verification, recency, and views.
 * Guests should not call this with a context — use chronological pool instead.
 */
export function rankFeedForYou(
  pool: FeedListingItem[],
  ctx: PersonalizationContext | null,
): FeedListingItem[] {
  if (pool.length === 0) return [];

  if (!ctx) {
    return [...pool].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  const scored = pool.map((item) => {
    let score = 0;

    if (item.user_id === ctx.viewerId) score -= 2000;

    if (ctx.favoriteCategories.has(item.category)) score += 55;
    if (ctx.implicitCategories.has(item.category)) score += 28;

    if (locationTokensMatch(ctx.viewerLocationNorm, item.location)) score += 42;

    if (ctx.connectedSellerIds.has(item.user_id)) score += 38;

    if (item.is_pro) score += 12;

    score += recencyScore(item.created_at);
    score += popularityScore(item.view_count);

    return { item, score };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.item.created_at.localeCompare(a.item.created_at);
  });

  return scored.map((s) => s.item);
}

/** Listings near the viewer's profile location; falls back to global chronological when no match. */
export function filterNearMeFeed(
  pool: FeedListingItem[],
  viewerLocationNorm: string | null,
): FeedListingItem[] {
  if (pool.length === 0) return [];
  if (!viewerLocationNorm) {
    return [...pool].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  const matched = pool.filter((item) => locationTokensMatch(viewerLocationNorm, item.location));
  const base = matched.length > 0 ? matched : pool;
  return [...base].sort((a, b) => b.created_at.localeCompare(a.created_at));
}
