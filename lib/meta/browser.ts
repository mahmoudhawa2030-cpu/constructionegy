/** Browser-only Meta helpers (Pixel + CAPI bridge). */

export type MetaBrowserEventName =
  | "PageView"
  | "Lead"
  | "CompleteRegistration"
  | "ViewContent"
  | "Search"
  | "Contact"
  | "AddToWishlist";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    __metaRecentEvents?: Map<string, number>;
  }
}

export function newBrowserEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `ev_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function claimEventSlot(key: string, ttlMs = 2000): boolean {
  if (typeof window === "undefined") return true;
  if (!window.__metaRecentEvents) window.__metaRecentEvents = new Map();
  const map = window.__metaRecentEvents;
  const now = Date.now();
  const prev = map.get(key);
  if (prev && now - prev < ttlMs) return false;
  map.set(key, now);
  if (map.size > 80) {
    for (const [k, ts] of map) {
      if (now - ts > 15_000) map.delete(k);
    }
  }
  return true;
}

export function trackMetaBrowserEvent(
  eventName: MetaBrowserEventName,
  options?: {
    eventId?: string;
    customData?: Record<string, unknown>;
    email?: string;
    phone?: string;
    externalId?: string;
    eventSourceUrl?: string;
  },
): string {
  const eventId = options?.eventId ?? newBrowserEventId();
  const eventSourceUrl =
    options?.eventSourceUrl ??
    (typeof window !== "undefined" ? window.location.href : undefined);

  if (eventName === "PageView") {
    const urlKey = `PageView|${eventSourceUrl ?? ""}`;
    if (!claimEventSlot(urlKey, 2000)) return eventId;
  } else if (eventName === "ViewContent") {
    const ids = options?.customData?.content_ids;
    const id = Array.isArray(ids) ? String(ids[0] ?? "") : "";
    if (id && !claimEventSlot(`ViewContent|${id}`, 30_000)) return eventId;
  } else if (eventName === "Search") {
    const q = String(options?.customData?.search_string ?? "");
    if (q && !claimEventSlot(`Search|${q}`, 10_000)) return eventId;
  } else if (options?.eventId) {
    if (!claimEventSlot(`id:${options.eventId}`, 60_000)) return eventId;
  }

  try {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("track", eventName, options?.customData ?? {}, { eventID: eventId });
    }
  } catch {
    // ignore
  }

  try {
    const body = {
      event_name: eventName,
      event_id: eventId,
      event_source_url: eventSourceUrl,
      email: options?.email,
      phone: options?.phone,
      external_id: options?.externalId,
      fbp: readCookie("_fbp"),
      fbc: readCookie("_fbc"),
      custom_data: options?.customData,
    };
    void fetch("/api/meta/capi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignore
  }

  return eventId;
}