import "server-only";

import { getSiteUrl } from "@/lib/seo/site-url";

/**
 * Ping IndexNow (Bing, Yandex, Seznam, Naver, etc.) when a URL is published/updated.
 * Set INDEXNOW_KEY in env (any random string you host at /{key}.txt — see app/api/indexnow-key).
 * No-ops when key is missing so local/dev never fails.
 */
export async function submitIndexNow(urls: string | string[]): Promise<void> {
  const key = process.env.INDEXNOW_KEY?.trim();
  if (!key) return;

  const host = (() => {
    try {
      return new URL(getSiteUrl()).host;
    } catch {
      return "";
    }
  })();
  if (!host) return;

  const list = (Array.isArray(urls) ? urls : [urls])
    .map((u) => u.trim())
    .filter(Boolean);
  if (list.length === 0) return;

  const keyLocation = `${getSiteUrl()}/api/indexnow-verify`;

  try {
    await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key,
        keyLocation,
        urlList: list.slice(0, 10000),
      }),
      // Don't hang publish on slow IndexNow
      signal: AbortSignal.timeout(8000),
    });
  } catch (err) {
    console.error("[indexnow] submit failed", err);
  }
}
