/** Args from the client server action may deserialize as an array or an array-like object. */
export function normalizeImageUrlsArgument(raw: unknown): string[] {
  if (raw == null) return [];

  if (Array.isArray(raw)) {
    const out = raw
      .map((x) => (typeof x === "string" ? x.trim() : String(x ?? "").trim()))
      .filter((s) => s.length > 0);
    return [...new Set(out)];
  }

  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const keys = Object.keys(o).sort((a, b) => {
      const na = Number(a);
      const nb = Number(b);
      if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
      return a.localeCompare(b);
    });
    return normalizeImageUrlsArgument(keys.map((k) => o[k]));
  }

  return [];
}

/** Normalize `feed_posts.images` from PostgREST/JSON into a clean string[]. */
export function normalizeFeedPostImages(raw: unknown): string[] {
  if (raw == null) return [];

  if (Array.isArray(raw)) {
    const out = raw
      .map((x) => (typeof x === "string" ? x.trim() : String(x ?? "").trim()))
      .filter((s) => s.length > 0);
    return [...new Set(out)];
  }

  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return [];
    if (t.startsWith("[") || t.startsWith("{")) {
      try {
        return normalizeFeedPostImages(JSON.parse(t) as unknown);
      } catch {
        return [t];
      }
    }
    return [t];
  }

  return [];
}
