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

/** Dual-decay: strong boost first 2 days, gentle long tail up to ~14 days (like LinkedIn). */
function recencyScore(createdAt: string): number {
  const ageDays = (Date.now() - new Date(createdAt).getTime()) / 86_400_000;
  return 38 * Math.exp(-ageDays / 2) + 16 * Math.exp(-ageDays / 14);
}

/** Logarithmic engagement: comments signal intent more than likes, views are background signal. */
function engagementScore(item: FeedPostItem): number {
  const likes = Math.min(22, Math.log1p(item.likeCount) * 5.5);
  const comments = Math.min(28, Math.log1p(item.commentCount) * 9);
  const views = Math.min(12, Math.log1p(item.view_count) * 2.5);
  return likes + comments + views;
}

/** Author diversity: interleave so no single author dominates the feed (Facebook/LinkedIn style). */
function applyAuthorDiversity(ranked: FeedPostItem[]): FeedPostItem[] {
  const result: FeedPostItem[] = [];
  const authorCount = new Map<string, number>();
  const deferred: FeedPostItem[] = [];
  const MAX_PER_AUTHOR = 3;

  for (const item of ranked) {
    const count = authorCount.get(item.user_id) ?? 0;
    const lastAuthor = result.at(-1)?.user_id;
    const secondLastAuthor = result.at(-2)?.user_id;
    const wouldBeThirdConsecutive =
      lastAuthor === item.user_id && secondLastAuthor === item.user_id;

    if (count < MAX_PER_AUTHOR && !wouldBeThirdConsecutive) {
      result.push(item);
      authorCount.set(item.user_id, count + 1);
    } else {
      deferred.push(item);
    }
  }

  return [...result, ...deferred];
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

    // Bury own posts — never show your own content in For You
    if (item.user_id === ctx.viewerId) {
      score -= 2000;
      return { item, score };
    }

    // ── Affinity signals (strongest — based on past behaviour) ──
    // Saved this author before = highest intent signal (LinkedIn: "follow")
    if (ctx.savedAuthorIds.has(item.user_id)) score += 65;
    // Liked this author's posts before (Facebook: "you engage with this person")
    if (ctx.likedAuthorIds.has(item.user_id)) score += 50;
    // Had a conversation with this author (trust signal)
    if (ctx.connectedSellerIds.has(item.user_id)) score += 40;

    // ── Location proximity ──
    if (locationTokensMatch(ctx.viewerLocationNorm, item.location)) score += 45;

    // ── Credibility signals ──
    if (item.is_expert) score += 18;
    else if (item.is_pro) score += 10;

    // ── Engagement quality (global, not just viewer) ──
    score += engagementScore(item);

    // ── Recency (freshness always matters) ──
    score += recencyScore(item.created_at);

    return { item, score };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.item.created_at.localeCompare(a.item.created_at);
  });

  return applyAuthorDiversity(scored.map((s) => s.item));
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
