import type { FeedPostItem } from "@/lib/feed/fetch-feed-posts";

import type { PersonalizationContext } from "@/lib/feed/personalization-context";

function normalizeLocation(loc: string | null): string {
  return (loc ?? "").trim().toLowerCase();
}

function locationTokensMatch(viewerNorm: string | null, postLoc: string | null): boolean {
  if (!viewerNorm || !postLoc) return false;
  const L = normalizeLocation(postLoc);
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
  const ageDays = ageMs / 86_400_000;
  return 34 * Math.exp(-ageDays / 6);
}

function popularityScore(viewCount: number): number {
  return Math.min(18, Math.log1p(viewCount) * 4);
}

export function rankFeedPostsForYou(
  pool: FeedPostItem[],
  ctx: PersonalizationContext | null,
): FeedPostItem[] {
  if (pool.length === 0) return [];

  if (!ctx) {
    return [...pool].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  const scored = pool.map((item) => {
    let score = 0;
    if (item.user_id === ctx.viewerId) score -= 2000;
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

export function filterNearMePosts(
  pool: FeedPostItem[],
  viewerLocationNorm: string | null,
): FeedPostItem[] {
  if (pool.length === 0) return [];
  if (!viewerLocationNorm) {
    return [...pool].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  const matched = pool.filter((item) => locationTokensMatch(viewerLocationNorm, item.location));
  const base = matched.length > 0 ? matched : pool;
  return [...base].sort((a, b) => b.created_at.localeCompare(a.created_at));
}
